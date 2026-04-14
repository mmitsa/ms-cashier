using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting.Posting;

public interface ICardSettlementService
{
    Task<Result<long>> SettleClearingBatchAsync(
        int bankAccountId,
        decimal amount,
        DateTime settlementDate,
        decimal feesAmount,
        string? reference,
        CancellationToken ct = default);
}

/// <summary>
/// Settles a batch of card-swipe receipts sitting in 1120 (Card Payments Clearing)
/// against a bank account: Dr Bank, Dr 5205 (fees), Cr 1120 (gross amount).
/// </summary>
public class CardSettlementService : ICardSettlementService
{
    private readonly IUnitOfWork _uow;
    private readonly IJournalEntryService _journal;
    private readonly AccountResolver _resolver;
    private readonly ICurrentTenantService _tenant;

    public CardSettlementService(
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

    public async Task<Result<long>> SettleClearingBatchAsync(
        int bankAccountId,
        decimal amount,
        DateTime settlementDate,
        decimal feesAmount,
        string? reference,
        CancellationToken ct = default)
    {
        if (amount <= 0)
            return Result<long>.Failure("مبلغ التسوية يجب أن يكون أكبر من صفر");
        if (feesAmount < 0)
            return Result<long>.Failure("مبلغ العمولات لا يمكن أن يكون سالباً");
        if (feesAmount >= amount)
            return Result<long>.Failure("مبلغ العمولات لا يمكن أن يساوي أو يتجاوز إجمالي التسوية");

        // Resolve the bank's GL account from its FinanceAccount → ChartOfAccountId link.
        var bank = await _uow.Repository<FinanceAccount>().Query()
            .Where(f => f.Id == bankAccountId && f.TenantId == _tenant.TenantId && !f.IsDeleted)
            .Select(f => new { f.Id, f.Name, f.ChartOfAccountId })
            .FirstOrDefaultAsync(ct);

        if (bank is null)
            return Result<long>.Failure($"حساب البنك رقم {bankAccountId} غير موجود");
        if (bank.ChartOfAccountId is null)
            return Result<long>.Failure($"حساب البنك {bank.Name} غير مرتبط بحساب في شجرة الحسابات");

        var clearingId = await _resolver.GetAccountIdByCodeAsync("1120", ct);
        var feesId = await _resolver.GetAccountIdByCodeAsync("5205", ct);

        var netToBank = amount - feesAmount;

        var lines = new List<JournalLineDto>
        {
            new(
                AccountId: bank.ChartOfAccountId.Value,
                Debit: netToBank,
                Credit: 0m,
                Description: $"تسوية شبكة إلى {bank.Name} — {reference}"),
        };

        if (feesAmount > 0)
        {
            lines.Add(new JournalLineDto(
                AccountId: feesId,
                Debit: feesAmount,
                Credit: 0m,
                Description: $"عمولات شبكات الدفع — {reference}"));
        }

        lines.Add(new JournalLineDto(
            AccountId: clearingId,
            Debit: 0m,
            Credit: amount,
            Description: $"إقفال رصيد مدفوعات الشبكة — {reference}"));

        // SourceId: admin operation with no per-batch entity yet → use settlement ticks.
        var dto = new CreateJournalEntryDto(
            EntryDate: settlementDate,
            Source: JournalSource.Adjustment,
            Lines: lines,
            Reference: reference,
            DescriptionAr: $"تسوية دفعات الشبكة — {reference}",
            DescriptionEn: $"Card settlement batch — {reference}",
            SourceType: "CardSettlement",
            SourceId: settlementDate.Ticks,
            BranchId: null);

        return await _journal.CreateAndPostAsync(dto, ct);
    }
}
