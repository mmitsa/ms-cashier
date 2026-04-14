using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting.Posting;

/// <summary>
/// يرحّل دفعة قسط كسند قبض: مدين نقدية/بنك، دائن ذمم مدينة.
/// </summary>
public class InstallmentPaymentPostingService : IInstallmentPaymentPostingService
{
    private readonly IUnitOfWork _uow;
    private readonly IJournalEntryService _journal;
    private readonly AccountResolver _resolver;
    private readonly ICurrentTenantService _tenant;
    private readonly ILogger<InstallmentPaymentPostingService> _logger;

    public InstallmentPaymentPostingService(
        IUnitOfWork uow,
        IJournalEntryService journal,
        AccountResolver resolver,
        ICurrentTenantService tenant,
        ILogger<InstallmentPaymentPostingService> logger)
    {
        _uow = uow;
        _journal = journal;
        _resolver = resolver;
        _tenant = tenant;
        _logger = logger;
    }

    public async Task<Result<long>> PostInstallmentPaymentAsync(int installmentPaymentId, CancellationToken ct = default)
    {
        var payment = await _uow.Repository<InstallmentPayment>().Query()
            .FirstOrDefaultAsync(p => p.Id == installmentPaymentId, ct);

        if (payment is null)
            return Result<long>.Failure($"دفعة القسط رقم {installmentPaymentId} غير موجودة");

        if (payment.PaidAmount <= 0)
            return Result<long>.Failure("مبلغ الدفعة يجب أن يكون أكبر من صفر");

        var installment = await _uow.Repository<Installment>().Query()
            .FirstOrDefaultAsync(i =>
                i.Id == payment.InstallmentId &&
                i.TenantId == _tenant.TenantId &&
                !i.IsDeleted, ct);

        if (installment is null)
            return Result<long>.Failure($"التقسيط رقم {payment.InstallmentId} غير موجود");

        // Resolve cash/bank account.
        // InstallmentPayment currently has no FinanceAccountId column; default to system "1101".
        // If/when the entity gains a FinanceAccountId, prefer FinanceAccount.ChartOfAccountId first.
        int? cashAccountId = null;
        var financeAccountIdProp = payment.GetType().GetProperty("FinanceAccountId");
        if (financeAccountIdProp is not null)
        {
            var raw = financeAccountIdProp.GetValue(payment);
            if (raw is int faId && faId > 0)
            {
                var fa = await _uow.Repository<FinanceAccount>().Query()
                    .FirstOrDefaultAsync(a =>
                        a.Id == faId &&
                        a.TenantId == _tenant.TenantId &&
                        !a.IsDeleted, ct);

                if (fa?.ChartOfAccountId is int coaId)
                {
                    var coa = await _uow.Repository<ChartOfAccount>().Query()
                        .FirstOrDefaultAsync(a =>
                            a.Id == coaId &&
                            a.TenantId == _tenant.TenantId &&
                            !a.IsGroup &&
                            !a.IsDeleted, ct);
                    if (coa is not null)
                        cashAccountId = coa.Id;
                }

                if (cashAccountId is null)
                    _logger.LogWarning(
                        "InstallmentPayment {Id} FinanceAccount {FaId} has no usable GL link — falling back to 1101.",
                        payment.Id, faId);
            }
        }

        cashAccountId ??= await _resolver.GetAccountIdByCodeAsync("1101", ct);

        var arId = await _resolver.GetAccountIdByCodeAsync("1130", ct);
        var amount = payment.PaidAmount;
        var date = payment.PaidDate ?? DateTime.UtcNow;
        var reference = $"IP-{payment.Id}";

        var lines = new List<JournalLineDto>
        {
            new(
                AccountId: cashAccountId.Value,
                Debit: amount,
                Credit: 0m,
                Description: $"قبض قسط رقم {payment.PaymentNumber} — {reference}"),
            new(
                AccountId: arId,
                Debit: 0m,
                Credit: amount,
                Description: $"تسوية ذمم مدينة — قسط {payment.PaymentNumber}",
                ContactId: installment.ContactId)
        };

        var dto = new CreateJournalEntryDto(
            EntryDate: date,
            Source: JournalSource.Receipt,
            Lines: lines,
            Reference: reference,
            DescriptionAr: $"سند قبض دفعة قسط رقم {payment.PaymentNumber} — تقسيط #{installment.Id}",
            DescriptionEn: $"Installment payment receipt #{payment.PaymentNumber} — Installment {installment.Id}",
            SourceType: "InstallmentPayment",
            SourceId: payment.Id,
            BranchId: null);

        return await _journal.CreateAndPostAsync(dto, ct);
    }
}
