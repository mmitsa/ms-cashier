using MsCashier.Domain.Common;

namespace MsCashier.Application.Services.Accounting.Posting;

public interface IInstallmentPaymentPostingService
{
    /// <summary>
    /// Posts a receipt JE for an installment payment.
    /// Reads InstallmentPayment, finds the linked Installment->ContactId,
    /// debits Cash/Bank, credits AR.
    /// </summary>
    Task<Result<long>> PostInstallmentPaymentAsync(int installmentPaymentId, CancellationToken ct = default);
}
