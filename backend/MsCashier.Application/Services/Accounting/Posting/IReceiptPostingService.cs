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
}
