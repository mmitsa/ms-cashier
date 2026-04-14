using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities.Accounting;
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

    public PaymentPostingService(
        IUnitOfWork uow,
        IJournalEntryService journal,
        AccountResolver resolver,
        ICurrentTenantService tenant)
    {
        _uow = uow;
        _journal = journal;
        _resolver = resolver;
        _tenant = tenant;
    }

    public async Task<Result<long>> PostSupplierPaymentAsync(
        int contactId,
        decimal amount,
        int cashAccountId,
        DateTime date,
        string? reference,
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
            SourceType: "SupplierPayment",
            SourceId: null,
            BranchId: null);

        return await _journal.CreateAndPostAsync(dto, ct);
    }
}
