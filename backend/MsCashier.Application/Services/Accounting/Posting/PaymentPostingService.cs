using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Enums.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting.Posting;

/// <summary>
/// مدفوعات الموردين: مدين ذمم دائنة، دائن نقدية/بنك.
/// </summary>
public class PaymentPostingService : IPaymentPostingService
{
    private readonly IUnitOfWork _uow;
    private readonly IJournalEntryService _journal;
    private readonly AccountResolver _resolver;
    private readonly ICurrentTenantService _tenant;
    private readonly ILogger<PaymentPostingService> _logger;

    public PaymentPostingService(
        IUnitOfWork uow,
        IJournalEntryService journal,
        AccountResolver resolver,
        ICurrentTenantService tenant,
        ILogger<PaymentPostingService> logger)
    {
        _uow = uow;
        _journal = journal;
        _resolver = resolver;
        _tenant = tenant;
        _logger = logger;
    }

    public async Task<Result<long>> PostSupplierPaymentAsync(
        int contactId,
        decimal amount,
        int cashAccountId,
        DateTime date,
        string? reference,
        long sourceId,
        CancellationToken ct = default)
    {
        if (amount <= 0)
            return Result<long>.Failure("مبلغ الدفع يجب أن يكون أكبر من صفر");

        // التحقق من أن حساب النقدية/البنك موجود وتابع للمستأجر
        var cashExists = await _uow.Repository<ChartOfAccount>().Query()
            .AnyAsync(a => a.Id == cashAccountId && a.TenantId == _tenant.TenantId && !a.IsDeleted, ct);
        if (!cashExists)
            return Result<long>.Failure($"حساب النقدية/البنك رقم {cashAccountId} غير موجود");

        var apId = await _resolver.GetAccountIdByCodeAsync("2101", ct); // Accounts Payable

        var lines = new List<JournalLineDto>
        {
            new(
                AccountId: apId,
                Debit: amount,
                Credit: 0m,
                Description: $"سداد للمورد — {reference}",
                ContactId: contactId),
            new(
                AccountId: cashAccountId,
                Debit: 0m,
                Credit: amount,
                Description: $"صرف نقدي/بنكي — {reference}")
        };

        var dto = new CreateJournalEntryDto(
            EntryDate: date,
            Source: JournalSource.Payment,
            Lines: lines,
            Reference: reference,
            DescriptionAr: $"سند صرف للمورد — {reference}",
            DescriptionEn: $"Supplier payment — {reference}",
            SourceType: "FinanceTransaction",
            SourceId: sourceId,
            BranchId: null);

        return await _journal.CreateAndPostAsync(dto, ct);
    }

    public async Task<Result<long>> RepostFromFinanceTransactionAsync(long financeTransactionId, CancellationToken ct = default)
    {
        var tx = await _uow.Repository<FinanceTransaction>().Query()
            .FirstOrDefaultAsync(t => t.Id == financeTransactionId, ct);
        if (tx is null)
            return Result<long>.Failure($"المعاملة المالية رقم {financeTransactionId} غير موجودة");

        if (tx.TransactionType == TransactionType.Income)
            return Result<long>.Failure("نوع المعاملة لا يطابق نوع الترحيل المطلوب");

        var account = await _uow.Repository<FinanceAccount>().Query()
            .FirstOrDefaultAsync(a => a.Id == tx.AccountId && !a.IsDeleted, ct);
        if (account is null)
            return Result<long>.Failure("الحساب المرتبط بالمعاملة غير موجود");

        if (!TryGetContactId(tx, out var contactId))
            return Result<long>.Failure("معرّف جهة الاتصال غير متوفر للمعاملة — لا يمكن إعادة الترحيل تلقائياً");

        var cashAccountId = await ResolveGlCashAccountIdAsync(account, ct);
        if (!cashAccountId.HasValue)
            return Result<long>.Failure("تعذّر تحديد حساب النقدية/البنك في شجرة الحسابات");

        var reference = $"FT-{tx.Id}";
        return await PostSupplierPaymentAsync(
            contactId, tx.Amount, cashAccountId.Value, tx.CreatedAt, reference, tx.Id, ct);
    }

    private async Task<int?> ResolveGlCashAccountIdAsync(FinanceAccount account, CancellationToken ct)
    {
        if (account.ChartOfAccountId.HasValue)
        {
            var mapped = await _uow.Repository<ChartOfAccount>().Query()
                .FirstOrDefaultAsync(x =>
                    x.Id == account.ChartOfAccountId.Value &&
                    x.TenantId == _tenant.TenantId &&
                    !x.IsGroup &&
                    !x.IsDeleted, ct);
            if (mapped is not null) return mapped.Id;
        }

        _logger.LogWarning(
            "RepostFromFinanceTransactionAsync: FinanceAccount {AccountId} has no explicit ChartOfAccountId — falling back to code 1101.",
            account.Id);

        var fallback = await _uow.Repository<ChartOfAccount>().Query()
            .FirstOrDefaultAsync(x =>
                x.TenantId == _tenant.TenantId &&
                x.Code == "1101" &&
                !x.IsGroup &&
                !x.IsDeleted, ct);
        return fallback?.Id;
    }

    private static bool TryGetContactId(FinanceTransaction tx, out int contactId)
    {
        contactId = 0;
        if (!string.Equals(tx.ReferenceType, "Contact", StringComparison.Ordinal)) return false;
        return int.TryParse(tx.ReferenceId, out contactId) && contactId > 0;
    }
}
