using MsCashier.Domain.Common;

namespace MsCashier.Application.Services.Accounting.Posting;

public interface ISalePostingService
{
    Task<Result<long>> PostSaleAsync(long invoiceId, CancellationToken ct = default);
}
