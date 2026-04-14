using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting;

/// <summary>
/// Journal engine: creates, posts, and reverses double-entry journal entries.
/// All operations run inside a transaction and enforce tenant isolation via
/// the DbContext global query filters.
/// </summary>
public class JournalEntryService : IJournalEntryService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public JournalEntryService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<long>> CreateAsync(CreateJournalEntryDto dto, CancellationToken ct = default)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var duplicate = await CheckDuplicateSourceAsync(dto, ct);
            if (duplicate is not null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<long>.Failure(duplicate);
            }

            var validation = await ValidateAndBuildAsync(dto, ct);
            if (!validation.IsSuccess)
            {
                await _uow.RollbackTransactionAsync();
                return Result<long>.Failure(validation.Errors);
            }

            var (period, totalDebit, totalCredit, lines) = validation.Data!;

            var entryNumber = await GenerateEntryNumberAsync(dto.EntryDate.Year, ct);

            var entry = new JournalEntry
            {
                EntryNumber = entryNumber,
                EntryDate = dto.EntryDate,
                PeriodId = period.Id,
                Reference = dto.Reference,
                DescriptionAr = dto.DescriptionAr,
                DescriptionEn = dto.DescriptionEn,
                Source = dto.Source,
                SourceType = dto.SourceType,
                SourceId = dto.SourceId,
                Status = JournalStatus.Draft,
                TotalDebit = totalDebit,
                TotalCredit = totalCredit,
                BranchId = dto.BranchId,
                Lines = lines
            };

            await _uow.Repository<JournalEntry>().AddAsync(entry);
            await _uow.SaveChangesAsync(ct);
            await _uow.CommitTransactionAsync();

            return Result<long>.Success(entry.Id, "تم إنشاء القيد كمسودة");
        }
        catch (Exception ex)
        {
            try { await _uow.RollbackTransactionAsync(); } catch { /* ignore */ }
            return Result<long>.Failure($"فشل إنشاء القيد: {ex.Message}");
        }
    }

    public async Task<Result> PostAsync(long entryId, CancellationToken ct = default)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var entry = await _uow.Repository<JournalEntry>().Query()
                .Include(e => e.Lines)
                .FirstOrDefaultAsync(e => e.Id == entryId, ct);

            if (entry is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result.Failure("القيد غير موجود");
            }

            if (entry.Status != JournalStatus.Draft)
            {
                await _uow.RollbackTransactionAsync();
                return Result.Failure("لا يمكن ترحيل قيد ليس بحالة مسودة");
            }

            var period = await _uow.Repository<AccountingPeriod>().Query()
                .FirstOrDefaultAsync(p => p.Id == entry.PeriodId, ct);

            if (period is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result.Failure("الفترة المحاسبية غير موجودة");
            }

            if (period.IsClosed)
            {
                await _uow.RollbackTransactionAsync();
                return Result.Failure("لا يمكن الترحيل لفترة محاسبية مقفولة");
            }

            // Recompute totals from current lines
            entry.TotalDebit = entry.Lines.Sum(l => l.Debit);
            entry.TotalCredit = entry.Lines.Sum(l => l.Credit);

            if (entry.TotalDebit != entry.TotalCredit)
            {
                await _uow.RollbackTransactionAsync();
                return Result.Failure("مجموع المدين لا يساوي مجموع الدائن");
            }

            entry.Status = JournalStatus.Posted;
            entry.PostedAt = DateTime.UtcNow;
            entry.PostedBy = _tenant.UserId == Guid.Empty ? null : _tenant.UserId;
            entry.UpdatedAt = DateTime.UtcNow;

            _uow.Repository<JournalEntry>().Update(entry);
            await _uow.SaveChangesAsync(ct);
            await _uow.CommitTransactionAsync();

            return Result.Success("تم ترحيل القيد");
        }
        catch (Exception ex)
        {
            try { await _uow.RollbackTransactionAsync(); } catch { /* ignore */ }
            return Result.Failure($"فشل ترحيل القيد: {ex.Message}");
        }
    }

    public async Task<Result<long>> CreateAndPostAsync(CreateJournalEntryDto dto, CancellationToken ct = default)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var duplicate = await CheckDuplicateSourceAsync(dto, ct);
            if (duplicate is not null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<long>.Failure(duplicate);
            }

            var validation = await ValidateAndBuildAsync(dto, ct);
            if (!validation.IsSuccess)
            {
                await _uow.RollbackTransactionAsync();
                return Result<long>.Failure(validation.Errors);
            }

            var (period, totalDebit, totalCredit, lines) = validation.Data!;

            if (period.IsClosed)
            {
                await _uow.RollbackTransactionAsync();
                return Result<long>.Failure("لا يمكن الترحيل لفترة محاسبية مقفولة");
            }

            var entryNumber = await GenerateEntryNumberAsync(dto.EntryDate.Year, ct);

            var now = DateTime.UtcNow;
            var entry = new JournalEntry
            {
                EntryNumber = entryNumber,
                EntryDate = dto.EntryDate,
                PeriodId = period.Id,
                Reference = dto.Reference,
                DescriptionAr = dto.DescriptionAr,
                DescriptionEn = dto.DescriptionEn,
                Source = dto.Source,
                SourceType = dto.SourceType,
                SourceId = dto.SourceId,
                Status = JournalStatus.Posted,
                PostedAt = now,
                PostedBy = _tenant.UserId == Guid.Empty ? null : _tenant.UserId,
                TotalDebit = totalDebit,
                TotalCredit = totalCredit,
                BranchId = dto.BranchId,
                Lines = lines
            };

            await _uow.Repository<JournalEntry>().AddAsync(entry);
            await _uow.SaveChangesAsync(ct);
            await _uow.CommitTransactionAsync();

            return Result<long>.Success(entry.Id, "تم إنشاء وترحيل القيد");
        }
        catch (Exception ex)
        {
            try { await _uow.RollbackTransactionAsync(); } catch { /* ignore */ }
            return Result<long>.Failure($"فشل إنشاء وترحيل القيد: {ex.Message}");
        }
    }

    public async Task<Result<long>> ReverseAsync(long entryId, string reasonAr, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(reasonAr))
            return Result<long>.Failure("سبب العكس مطلوب");

        try
        {
            await _uow.BeginTransactionAsync();

            var original = await _uow.Repository<JournalEntry>().Query()
                .Include(e => e.Lines)
                .FirstOrDefaultAsync(e => e.Id == entryId, ct);

            if (original is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<long>.Failure("القيد الأصلي غير موجود");
            }

            if (original.Status != JournalStatus.Posted)
            {
                await _uow.RollbackTransactionAsync();
                return Result<long>.Failure("يمكن عكس القيود المرحّلة فقط");
            }

            var entryDate = DateTime.UtcNow.Date;
            var period = await ResolvePeriodAsync(entryDate, ct);
            if (period is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<long>.Failure("لا توجد فترة محاسبية مفتوحة لهذا التاريخ");
            }

            if (period.IsClosed)
            {
                await _uow.RollbackTransactionAsync();
                return Result<long>.Failure("لا يمكن الترحيل لفترة محاسبية مقفولة");
            }

            short lineNum = 1;
            var reversedLines = original.Lines
                .OrderBy(l => l.LineNumber)
                .Select(l => new JournalLine
                {
                    LineNumber = lineNum++,
                    AccountId = l.AccountId,
                    Debit = l.Credit,
                    Credit = l.Debit,
                    Description = $"عكس: {l.Description}".Trim(),
                    ContactId = l.ContactId,
                    BranchId = l.BranchId,
                    CostCenter = l.CostCenter
                })
                .ToList();

            var entryNumber = await GenerateEntryNumberAsync(entryDate.Year, ct);
            var now = DateTime.UtcNow;

            var reversal = new JournalEntry
            {
                EntryNumber = entryNumber,
                EntryDate = entryDate,
                PeriodId = period.Id,
                Reference = original.EntryNumber,
                DescriptionAr = $"عكس قيد {original.EntryNumber}: {reasonAr}",
                DescriptionEn = $"Reversal of {original.EntryNumber}",
                Source = original.Source,
                SourceType = original.SourceType,
                SourceId = original.SourceId,
                Status = JournalStatus.Posted,
                PostedAt = now,
                PostedBy = _tenant.UserId == Guid.Empty ? null : _tenant.UserId,
                ReversesEntryId = original.Id,
                TotalDebit = reversedLines.Sum(l => l.Debit),
                TotalCredit = reversedLines.Sum(l => l.Credit),
                BranchId = original.BranchId,
                Lines = reversedLines
            };

            await _uow.Repository<JournalEntry>().AddAsync(reversal);

            original.Status = JournalStatus.Reversed;
            original.UpdatedAt = now;
            _uow.Repository<JournalEntry>().Update(original);

            await _uow.SaveChangesAsync(ct);
            await _uow.CommitTransactionAsync();

            return Result<long>.Success(reversal.Id, "تم عكس القيد");
        }
        catch (Exception ex)
        {
            try { await _uow.RollbackTransactionAsync(); } catch { /* ignore */ }
            return Result<long>.Failure($"فشل عكس القيد: {ex.Message}");
        }
    }

    // ────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Checks whether a non-reversed journal entry already exists for the given
    /// (SourceType, SourceId) pair within the current tenant. Returns a
    /// user-facing error message if a duplicate is found, otherwise null.
    /// Manual entries (SourceType or SourceId null) are allowed to repeat.
    /// </summary>
    private async Task<string?> CheckDuplicateSourceAsync(CreateJournalEntryDto dto, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(dto.SourceType) || dto.SourceId is null)
            return null;

        var existing = await _uow.Repository<JournalEntry>().Query()
            .Where(e => e.SourceType == dto.SourceType
                        && e.SourceId == dto.SourceId
                        && e.Status != JournalStatus.Reversed)
            .Select(e => new { e.EntryNumber })
            .FirstOrDefaultAsync(ct);

        if (existing is null)
            return null;

        return $"يوجد قيد بالفعل لهذا المرجع — Source: {dto.SourceType}#{dto.SourceId}, EntryNumber: {existing.EntryNumber}";
    }

    private async Task<Result<(AccountingPeriod Period, decimal TotalDebit, decimal TotalCredit, List<JournalLine> Lines)>>
        ValidateAndBuildAsync(CreateJournalEntryDto dto, CancellationToken ct)
    {
        if (dto.Lines is null || dto.Lines.Count < 2)
            return Result<(AccountingPeriod, decimal, decimal, List<JournalLine>)>.Failure("القيد يجب أن يحتوي على سطرين على الأقل");

        // Line-level checks: exactly one of Debit/Credit > 0, both non-negative
        foreach (var line in dto.Lines)
        {
            if (line.Debit < 0 || line.Credit < 0)
                return Result<(AccountingPeriod, decimal, decimal, List<JournalLine>)>.Failure("لا يجوز أن تكون قيمة المدين أو الدائن سالبة");

            var hasDebit = line.Debit > 0;
            var hasCredit = line.Credit > 0;
            if (hasDebit == hasCredit)
                return Result<(AccountingPeriod, decimal, decimal, List<JournalLine>)>.Failure("كل سطر يجب أن يحتوي على قيمة مدين أو دائن فقط (وليس الاثنين ولا صفر)");
        }

        var totalDebit = dto.Lines.Sum(l => l.Debit);
        var totalCredit = dto.Lines.Sum(l => l.Credit);
        if (totalDebit != totalCredit)
            return Result<(AccountingPeriod, decimal, decimal, List<JournalLine>)>.Failure("مجموع المدين لا يساوي مجموع الدائن");

        // Account validation: exist for current tenant, Active, not a group, not deleted
        var accountIds = dto.Lines.Select(l => l.AccountId).Distinct().ToList();
        var accounts = await _uow.Repository<ChartOfAccount>().Query()
            .Where(a => accountIds.Contains(a.Id))
            .ToListAsync(ct);

        if (accounts.Count != accountIds.Count)
            return Result<(AccountingPeriod, decimal, decimal, List<JournalLine>)>.Failure("أحد الحسابات غير موجود أو لا ينتمي لهذا التينانت");

        foreach (var acc in accounts)
        {
            if (!acc.IsActive)
                return Result<(AccountingPeriod, decimal, decimal, List<JournalLine>)>.Failure($"الحساب {acc.Code} غير مفعّل");
            if (acc.IsGroup)
                return Result<(AccountingPeriod, decimal, decimal, List<JournalLine>)>.Failure($"الحساب {acc.Code} حساب تجميعي ولا يقبل قيوداً مباشرة");
        }

        // Period resolution
        var period = await ResolvePeriodAsync(dto.EntryDate, ct);
        if (period is null)
            return Result<(AccountingPeriod, decimal, decimal, List<JournalLine>)>.Failure("لا توجد فترة محاسبية مفتوحة لهذا التاريخ");

        short lineNum = 1;
        var lines = dto.Lines.Select(l => new JournalLine
        {
            LineNumber = lineNum++,
            AccountId = l.AccountId,
            Debit = l.Debit,
            Credit = l.Credit,
            Description = l.Description,
            ContactId = l.ContactId,
            BranchId = l.BranchId ?? dto.BranchId,
            CostCenter = l.CostCenter
        }).ToList();

        return Result<(AccountingPeriod, decimal, decimal, List<JournalLine>)>.Success((period, totalDebit, totalCredit, lines));
    }

    private async Task<AccountingPeriod?> ResolvePeriodAsync(DateTime entryDate, CancellationToken ct)
    {
        return await _uow.Repository<AccountingPeriod>().Query()
            .Where(p => !p.IsClosed
                        && p.StartDate <= entryDate
                        && p.EndDate >= entryDate)
            .OrderBy(p => p.StartDate)
            .FirstOrDefaultAsync(ct);
    }

    /// <summary>
    /// Generates the next EntryNumber for the given fiscal year within the current
    /// tenant. Format: JE-{yyyy}-{seq:D6}.
    ///
    /// Strategy: inside the caller's transaction we query MAX(existing sequence)
    /// for (tenant, year) and add one. We rely on:
    ///   (a) the surrounding transaction (SaveChanges happens before commit) and
    ///   (b) the unique index on (TenantId, EntryNumber) which causes the DB to
    ///       reject a duplicate — letting the caller retry or surface the error.
    /// This avoids introducing a dedicated counter table while still giving a
    /// monotonic per-tenant-per-year sequence. For very high concurrent write
    /// volume a dedicated counter table with UPDLOCK should replace this.
    /// </summary>
    private async Task<string> GenerateEntryNumberAsync(int year, CancellationToken ct)
    {
        var prefix = $"JE-{year:D4}-";

        var lastNumber = await _uow.Repository<JournalEntry>().Query()
            .Where(e => e.EntryNumber.StartsWith(prefix))
            .OrderByDescending(e => e.EntryNumber)
            .Select(e => e.EntryNumber)
            .FirstOrDefaultAsync(ct);

        int nextSeq = 1;
        if (!string.IsNullOrEmpty(lastNumber) && lastNumber.Length > prefix.Length)
        {
            var tail = lastNumber.Substring(prefix.Length);
            if (int.TryParse(tail, out var parsed))
                nextSeq = parsed + 1;
        }

        return $"{prefix}{nextSeq:D6}";
    }
}
