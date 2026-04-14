using MsCashier.Domain.Common;

namespace MsCashier.Application.Services.Accounting.Posting;

public interface IReceiptPostingService
{
    Task<Result<long>> PostCustomerReceiptAsync(
        int contactId,
        decimal amount,
        int cashAccountId,
        DateTime date,
        string? reference,
        long sourceId,
        CancellationToken ct = default);

    /// <summary>
    /// Idempotent re-post by FinanceTransaction id. Used by admin retry.
    /// Loads the transaction + linked FinanceAccount, reconstructs the original
    /// PostCustomerReceiptAsync call, and delegates. Fails gracefully if the
    /// journal engine's (SourceType,SourceId) duplicate guard kicks in —
    /// the caller should treat "يوجد قيد بالفعل" as a successful resolution.
    /// </summary>
    Task<Result<long>> RepostFromFinanceTransactionAsync(long financeTransactionId, CancellationToken ct = default);
}
