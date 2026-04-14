using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting.Posting;

/// <summary>
/// مقبوضات العملاء: مدين نقدية/بنك، دائن ذمم مدينة.
/// </summary>
public class ReceiptPostingService : IReceiptPostingService
{
    private readonly IUnitOfWork _uow;
    private readonly IJournalEntryService _journal;
    private readonly AccountResolver _resolver;
    private readonly ICurrentTenantService _tenant;

    public ReceiptPostingService(
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

    public async Task<Result<long>> PostCustomerReceiptAsync(
        int contactId,
        decimal amount,
        int cashAccountId,
        DateTime date,
        string? reference,
        long sourceId,
        CancellationToken ct = default)
    {
        if (amount <= 0)
            return Result<long>.Failure("مبلغ القبض يجب أن يكون أكبر من صفر");

        var cashExists = await _uow.Repository<ChartOfAccount>().Query()
            .AnyAsync(a => a.Id == cashAccountId && a.TenantId == _tenant.TenantId && !a.IsDeleted, ct);
        if (!cashExists)
            return Result<long>.Failure($"حساب النقدية/البنك رقم {cashAccountId} غير موجود");

        var arId = await _resolver.GetAccountIdByCodeAsync("1130", ct); // Accounts Receivable

        var lines = new List<JournalLineDto>
        {
            new(
                AccountId: cashAccountId,
                Debit: amount,
                Credit: 0m,
                Description: $"قبض نقدي/بنكي — {reference}"),
            new(
                AccountId: arId,
                Debit: 0m,
                Credit: amount,
                Description: $"تسوية ذمم مدينة من العميل — {reference}",
                ContactId: contactId)
        };

        var dto = new CreateJournalEntryDto(
            EntryDate: date,
            Source: JournalSource.Receipt,
            Lines: lines,
            Reference: reference,
            DescriptionAr: $"سند قبض من العميل — {reference}",
            DescriptionEn: $"Customer receipt — {reference}",
            SourceType: "FinanceTransaction",
            SourceId: sourceId,
            BranchId: null);

        return await _journal.CreateAndPostAsync(dto, ct);
    }
}
