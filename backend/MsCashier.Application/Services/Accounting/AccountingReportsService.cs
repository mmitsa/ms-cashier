using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting;

/// <summary>
/// خدمة التقارير المحاسبية (للقراءة فقط): ميزان المراجعة، قائمة الدخل،
/// الميزانية العمومية، كشف حساب جهة اتصال.
/// </summary>
public class AccountingReportsService : IAccountingReportsService
{
    private readonly IUnitOfWork _uow;

    public AccountingReportsService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Result<TrialBalanceDto>> GetTrialBalanceAsync(
        DateTime fromDate, DateTime toDate, int? branchId = null, CancellationToken ct = default)
    {
        if (toDate < fromDate)
            return Result<TrialBalanceDto>.Failure("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");

        var accounts = _uow.Repository<ChartOfAccount>().Query();
        var lines = PostedLines(branchId);

        // Opening balances: sum of lines before fromDate, grouped by account
        var openingQuery = lines
            .Where(l => l.JournalEntry!.EntryDate < fromDate)
            .GroupBy(l => l.AccountId)
            .Select(g => new
            {
                AccountId = g.Key,
                Debit = g.Sum(x => x.Debit),
                Credit = g.Sum(x => x.Credit)
            });

        // Period movements: lines in range
        var periodQuery = lines
            .Where(l => l.JournalEntry!.EntryDate >= fromDate && l.JournalEntry!.EntryDate <= toDate)
            .GroupBy(l => l.AccountId)
            .Select(g => new
            {
                AccountId = g.Key,
                Debit = g.Sum(x => x.Debit),
                Credit = g.Sum(x => x.Credit)
            });

        var opening = await openingQuery.ToListAsync(ct);
        var period = await periodQuery.ToListAsync(ct);

        var activeAccountIds = opening.Select(o => o.AccountId)
            .Union(period.Select(p => p.AccountId))
            .ToHashSet();

        if (activeAccountIds.Count == 0)
        {
            return Result<TrialBalanceDto>.Success(
                new TrialBalanceDto(fromDate, toDate, Array.Empty<TrialBalanceRowDto>(), 0m, 0m));
        }

        var accountList = await accounts
            .Where(a => activeAccountIds.Contains(a.Id) && !a.IsGroup)
            .Select(a => new { a.Id, a.Code, a.NameAr, a.Category })
            .ToListAsync(ct);

        var openingMap = opening.ToDictionary(o => o.AccountId);
        var periodMap = period.ToDictionary(p => p.AccountId);

        var rows = new List<TrialBalanceRowDto>(accountList.Count);
        decimal totalDebit = 0m, totalCredit = 0m;

        foreach (var a in accountList.OrderBy(a => a.Code))
        {
            openingMap.TryGetValue(a.Id, out var o);
            periodMap.TryGetValue(a.Id, out var p);

            var openDebit = o?.Debit ?? 0m;
            var openCredit = o?.Credit ?? 0m;
            var perDebit = p?.Debit ?? 0m;
            var perCredit = p?.Credit ?? 0m;

            // Net opening signed as debit (positive) / credit (positive)
            var openNet = openDebit - openCredit;
            var closeNet = openNet + (perDebit - perCredit);

            decimal closingDebit = closeNet > 0 ? closeNet : 0m;
            decimal closingCredit = closeNet < 0 ? -closeNet : 0m;

            decimal openingDebitNorm = openNet > 0 ? openNet : 0m;
            decimal openingCreditNorm = openNet < 0 ? -openNet : 0m;

            if (openingDebitNorm == 0 && openingCreditNorm == 0 && perDebit == 0 && perCredit == 0)
                continue;

            rows.Add(new TrialBalanceRowDto(
                a.Code, a.NameAr, a.Category,
                openingDebitNorm, openingCreditNorm,
                perDebit, perCredit,
                closingDebit, closingCredit));

            totalDebit += closingDebit;
            totalCredit += closingCredit;
        }

        return Result<TrialBalanceDto>.Success(
            new TrialBalanceDto(fromDate, toDate, rows, totalDebit, totalCredit));
    }

    public async Task<Result<IncomeStatementDto>> GetIncomeStatementAsync(
        DateTime fromDate, DateTime toDate, int? branchId = null, CancellationToken ct = default)
    {
        if (toDate < fromDate)
            return Result<IncomeStatementDto>.Failure("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");

        var result = await ComputeIncomeStatementAsync(fromDate, toDate, branchId, ct);
        return Result<IncomeStatementDto>.Success(result);
    }

    public async Task<Result<BalanceSheetDto>> GetBalanceSheetAsync(
        DateTime asOfDate, int? branchId = null, CancellationToken ct = default)
    {
        var lines = PostedLines(branchId)
            .Where(l => l.JournalEntry!.EntryDate <= asOfDate);

        // Aggregate balances in SQL, joined with account metadata
        var balances = await lines
            .GroupBy(l => l.AccountId)
            .Select(g => new
            {
                AccountId = g.Key,
                Debit = g.Sum(x => x.Debit),
                Credit = g.Sum(x => x.Credit)
            })
            .Join(_uow.Repository<ChartOfAccount>().Query().Where(a => !a.IsGroup),
                b => b.AccountId,
                a => a.Id,
                (b, a) => new { a.Code, a.NameAr, a.Category, a.Nature, b.Debit, b.Credit })
            .ToListAsync(ct);

        var assets = new List<BalanceSheetLineDto>();
        var liabilities = new List<BalanceSheetLineDto>();
        var equity = new List<BalanceSheetLineDto>();
        decimal totalAssets = 0m, totalLiabilities = 0m, totalEquity = 0m;

        foreach (var b in balances.OrderBy(b => b.Code))
        {
            var net = b.Debit - b.Credit;
            switch (b.Category)
            {
                case AccountCategory.Asset:
                    if (net == 0) continue;
                    assets.Add(new BalanceSheetLineDto(b.Code, b.NameAr, net));
                    totalAssets += net;
                    break;
                case AccountCategory.Liability:
                    var liab = -net; // credit-natural
                    if (liab == 0) continue;
                    liabilities.Add(new BalanceSheetLineDto(b.Code, b.NameAr, liab));
                    totalLiabilities += liab;
                    break;
                case AccountCategory.Equity:
                    var eq = -net; // credit-natural
                    if (eq == 0) continue;
                    equity.Add(new BalanceSheetLineDto(b.Code, b.NameAr, eq));
                    totalEquity += eq;
                    break;
            }
        }

        // Current year earnings = net income from fiscal year start (Jan 1) through asOfDate
        var fyStart = new DateTime(asOfDate.Year, 1, 1);
        var ytdIncome = await ComputeIncomeStatementAsync(fyStart, asOfDate, branchId, ct);
        var retainedEarnings = ytdIncome.NetIncome;

        var totalEquityWithEarnings = totalEquity + retainedEarnings;
        var isBalanced = Math.Abs(totalAssets - (totalLiabilities + totalEquityWithEarnings)) < 0.01m;

        return Result<BalanceSheetDto>.Success(new BalanceSheetDto(
            asOfDate,
            assets, totalAssets,
            liabilities, totalLiabilities,
            equity, totalEquityWithEarnings,
            retainedEarnings,
            isBalanced));
    }

    public async Task<Result<ContactStatementDto>> GetContactStatementAsync(
        int contactId, DateTime fromDate, DateTime toDate, CancellationToken ct = default)
    {
        if (toDate < fromDate)
            return Result<ContactStatementDto>.Failure("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");

        var contact = await _uow.Repository<Contact>().Query()
            .Where(c => c.Id == contactId)
            .Select(c => new { c.Id, c.Name })
            .FirstOrDefaultAsync(ct);

        if (contact is null)
            return Result<ContactStatementDto>.Failure($"جهة الاتصال رقم {contactId} غير موجودة");

        var lines = _uow.Repository<JournalLine>().Query()
            .Where(l => l.ContactId == contactId
                        && l.JournalEntry!.Status == JournalStatus.Posted);

        // Opening balance (before fromDate): aggregated in SQL by account nature
        var openingRaw = await lines
            .Where(l => l.JournalEntry!.EntryDate < fromDate)
            .Join(_uow.Repository<ChartOfAccount>().Query(),
                l => l.AccountId,
                a => a.Id,
                (l, a) => new { a.Nature, l.Debit, l.Credit })
            .GroupBy(x => x.Nature)
            .Select(g => new
            {
                Nature = g.Key,
                Debit = g.Sum(x => x.Debit),
                Credit = g.Sum(x => x.Credit)
            })
            .ToListAsync(ct);

        // Determine the dominant nature: use the first line (account the contact is attached to).
        // AR accounts are Debit-natural, AP accounts are Credit-natural.
        var firstLineNature = await lines
            .OrderBy(l => l.JournalEntry!.EntryDate)
            .ThenBy(l => l.Id)
            .Join(_uow.Repository<ChartOfAccount>().Query(),
                l => l.AccountId, a => a.Id, (l, a) => a.Nature)
            .FirstOrDefaultAsync(ct);

        // If no lines exist at all, default to Debit (AR-style).
        var dominantNature = firstLineNature == default ? AccountNature.Debit : firstLineNature;

        decimal opening = 0m;
        foreach (var o in openingRaw)
        {
            // Signed as positive balance in the account's natural direction.
            var signed = o.Nature == AccountNature.Debit
                ? o.Debit - o.Credit
                : o.Credit - o.Debit;

            // Re-express in the dominant nature's sign.
            if (o.Nature != dominantNature) signed = -signed;
            opening += signed;
        }

        // Period entries with account nature (needed for running balance direction)
        var entries = await lines
            .Where(l => l.JournalEntry!.EntryDate >= fromDate
                        && l.JournalEntry!.EntryDate <= toDate)
            .Join(_uow.Repository<ChartOfAccount>().Query(),
                l => l.AccountId, a => a.Id,
                (l, a) => new
                {
                    l.JournalEntry!.EntryDate,
                    l.JournalEntry!.EntryNumber,
                    l.JournalEntry!.Reference,
                    Description = l.Description ?? l.JournalEntry!.DescriptionAr,
                    l.Debit,
                    l.Credit,
                    a.Nature
                })
            .OrderBy(x => x.EntryDate)
            .ThenBy(x => x.EntryNumber)
            .ToListAsync(ct);

        var entryDtos = new List<ContactStatementEntryDto>(entries.Count);
        decimal running = opening;

        foreach (var e in entries)
        {
            var delta = e.Nature == AccountNature.Debit
                ? e.Debit - e.Credit
                : e.Credit - e.Debit;
            if (e.Nature != dominantNature) delta = -delta;

            running += delta;

            entryDtos.Add(new ContactStatementEntryDto(
                e.EntryDate, e.EntryNumber, e.Reference, e.Description,
                e.Debit, e.Credit, running));
        }

        return Result<ContactStatementDto>.Success(new ContactStatementDto(
            contact.Id, contact.Name, fromDate, toDate,
            opening, entryDtos, running));
    }

    // ---------------- helpers ----------------

    private IQueryable<JournalLine> PostedLines(int? branchId)
    {
        var q = _uow.Repository<JournalLine>().Query()
            .Where(l => l.JournalEntry!.Status == JournalStatus.Posted);

        if (branchId.HasValue)
            q = q.Where(l => l.BranchId == branchId.Value);

        return q;
    }

    private async Task<IncomeStatementDto> ComputeIncomeStatementAsync(
        DateTime fromDate, DateTime toDate, int? branchId, CancellationToken ct)
    {
        var lines = PostedLines(branchId)
            .Where(l => l.JournalEntry!.EntryDate >= fromDate
                        && l.JournalEntry!.EntryDate <= toDate);

        var agg = await lines
            .GroupBy(l => l.AccountId)
            .Select(g => new
            {
                AccountId = g.Key,
                Debit = g.Sum(x => x.Debit),
                Credit = g.Sum(x => x.Credit)
            })
            .Join(_uow.Repository<ChartOfAccount>().Query()
                    .Where(a => !a.IsGroup
                                && (a.Category == AccountCategory.Revenue
                                    || a.Category == AccountCategory.Expense)),
                g => g.AccountId,
                a => a.Id,
                (g, a) => new { a.Code, a.NameAr, a.Category, g.Debit, g.Credit })
            .ToListAsync(ct);

        var revenues = new List<IncomeStatementLineDto>();
        var expenses = new List<IncomeStatementLineDto>();
        decimal totalRevenue = 0m, totalExpenses = 0m;

        foreach (var row in agg.OrderBy(r => r.Code))
        {
            if (row.Category == AccountCategory.Revenue)
            {
                var amt = row.Credit - row.Debit;
                if (amt == 0) continue;
                revenues.Add(new IncomeStatementLineDto(row.Code, row.NameAr, amt));
                totalRevenue += amt;
            }
            else // Expense
            {
                var amt = row.Debit - row.Credit;
                if (amt == 0) continue;
                expenses.Add(new IncomeStatementLineDto(row.Code, row.NameAr, amt));
                totalExpenses += amt;
            }
        }

        return new IncomeStatementDto(
            fromDate, toDate,
            revenues, totalRevenue,
            expenses, totalExpenses,
            totalRevenue - totalExpenses);
    }
}
