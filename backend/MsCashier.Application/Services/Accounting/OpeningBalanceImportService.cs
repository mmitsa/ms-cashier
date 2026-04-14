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
/// Imports per-contact opening balances as one posted journal entry per contact.
///
/// Balancing approach: the contra side is equity account <c>"3103" Retained Earnings</c>
/// — NOT <c>"3104" Current Year Earnings</c>. Opening balances represent prior-period
/// activity and must not affect the current year's P&amp;L. "3104" is reserved for the
/// running current-year result and would distort it; "3103" is the correct equity
/// carry-forward bucket for pre-system balances.
///
/// Idempotency: each JE is tagged with <c>SourceType="OpeningBalance", SourceId=ContactId</c>.
/// The journal engine rejects duplicates on this pair — re-importing the same contact
/// fails gracefully and is counted as <c>Skipped</c>.
/// </summary>
public class OpeningBalanceImportService : IOpeningBalanceImportService
{
    private const string ArAccountCode = "1130";      // Accounts Receivable
    private const string ApAccountCode = "2101";      // Accounts Payable
    private const string EquityAccountCode = "3103";  // Retained Earnings
    private const string OpeningBalanceSourceType = "OpeningBalance";

    private readonly IUnitOfWork _uow;
    private readonly IJournalEntryService _journalService;

    public OpeningBalanceImportService(IUnitOfWork uow, IJournalEntryService journalService)
    {
        _uow = uow;
        _journalService = journalService;
    }

    public async Task<Result<OpeningBalanceImportResultDto>> ImportAsync(
        ImportOpeningBalancesRequest request,
        CancellationToken ct = default)
    {
        if (request is null)
            return Result<OpeningBalanceImportResultDto>.Failure("الطلب فارغ");

        if (request.Rows is null || request.Rows.Count == 0)
            return Result<OpeningBalanceImportResultDto>.Failure("يجب إدخال صف واحد على الأقل");

        // Validate an open period covers the opening date
        var period = await _uow.Repository<AccountingPeriod>().Query()
            .FirstOrDefaultAsync(p => !p.IsClosed
                                      && p.StartDate <= request.OpeningDate
                                      && p.EndDate >= request.OpeningDate, ct);
        if (period is null)
            return Result<OpeningBalanceImportResultDto>.Failure("لا توجد فترة محاسبية مفتوحة لتاريخ الرصيد الافتتاحي");

        // Resolve required accounts for the current tenant (global filters apply)
        var accounts = await _uow.Repository<ChartOfAccount>().Query()
            .Where(a => a.Code == ArAccountCode
                        || a.Code == ApAccountCode
                        || a.Code == EquityAccountCode)
            .ToListAsync(ct);

        var arAccount = accounts.FirstOrDefault(a => a.Code == ArAccountCode);
        var apAccount = accounts.FirstOrDefault(a => a.Code == ApAccountCode);
        var equityAccount = accounts.FirstOrDefault(a => a.Code == EquityAccountCode);

        if (arAccount is null)
            return Result<OpeningBalanceImportResultDto>.Failure($"حساب الذمم المدينة ({ArAccountCode}) غير موجود لهذا التينانت");
        if (apAccount is null)
            return Result<OpeningBalanceImportResultDto>.Failure($"حساب الذمم الدائنة ({ApAccountCode}) غير موجود لهذا التينانت");
        if (equityAccount is null)
            return Result<OpeningBalanceImportResultDto>.Failure($"حساب الأرباح المحتجزة ({EquityAccountCode}) غير موجود لهذا التينانت");

        // Preload the set of valid contact ids for the current tenant
        var requestedIds = request.Rows.Select(r => r.ContactId).Distinct().ToList();
        var validContactIds = await _uow.Repository<Contact>().Query()
            .Where(c => requestedIds.Contains(c.Id))
            .Select(c => c.Id)
            .ToListAsync(ct);
        var validContactIdSet = new HashSet<int>(validContactIds);

        int processed = 0;
        int posted = 0;
        int skipped = 0;
        decimal totalDebit = 0m;
        decimal totalCredit = 0m;
        var errors = new List<string>();

        foreach (var row in request.Rows)
        {
            processed++;

            if (row.Balance == 0m)
            {
                skipped++;
                continue;
            }

            if (!validContactIdSet.Contains(row.ContactId))
            {
                skipped++;
                errors.Add($"جهة الاتصال #{row.ContactId} غير موجودة لهذا التينانت");
                continue;
            }

            var amount = Math.Abs(row.Balance);
            var descriptionAr = string.IsNullOrWhiteSpace(request.Description)
                ? "رصيد افتتاحي"
                : request.Description!;

            List<JournalLineDto> lines;
            if (row.Balance > 0m)
            {
                // Customer owes us: Dr 1130 (contact) / Cr 3103
                lines = new List<JournalLineDto>
                {
                    new(arAccount.Id, amount, 0m, descriptionAr, row.ContactId),
                    new(equityAccount.Id, 0m, amount, descriptionAr)
                };
            }
            else
            {
                // We owe supplier: Dr 3103 / Cr 2101 (contact)
                lines = new List<JournalLineDto>
                {
                    new(equityAccount.Id, amount, 0m, descriptionAr),
                    new(apAccount.Id, 0m, amount, descriptionAr, row.ContactId)
                };
            }

            var dto = new CreateJournalEntryDto(
                EntryDate: request.OpeningDate,
                Source: JournalSource.OpeningBalance,
                Lines: lines,
                Reference: $"Opening-{row.ContactId}",
                DescriptionAr: descriptionAr,
                DescriptionEn: null,
                SourceType: OpeningBalanceSourceType,
                SourceId: row.ContactId,
                BranchId: null);

            var result = await _journalService.CreateAndPostAsync(dto, ct);
            if (result.IsSuccess)
            {
                posted++;
                totalDebit += amount;
                totalCredit += amount;
            }
            else
            {
                var message = result.Errors is { Count: > 0 }
                    ? string.Join("; ", result.Errors)
                    : "فشل غير معروف";

                // Duplicate-source error from the engine → idempotent skip
                if (message.Contains("يوجد قيد بالفعل", StringComparison.Ordinal))
                {
                    skipped++;
                }
                else
                {
                    skipped++;
                    errors.Add($"جهة الاتصال #{row.ContactId}: {message}");
                }
            }
        }

        var summary = new OpeningBalanceImportResultDto(
            RowsProcessed: processed,
            RowsPosted: posted,
            RowsSkipped: skipped,
            TotalDebit: totalDebit,
            TotalCredit: totalCredit,
            Errors: errors);

        return Result<OpeningBalanceImportResultDto>.Success(
            summary,
            $"تمت معالجة {processed} صفاً ({posted} ترحيل / {skipped} تخطّي)");
    }
}
