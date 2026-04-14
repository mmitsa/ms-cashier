using MsCashier.Application.DTOs.Accounting;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces.Accounting;

public interface IOpeningBalanceImportService
{
    /// <summary>
    /// Imports per-contact opening balances by generating a single
    /// <c>OpeningBalance</c> journal entry per contact. Idempotent on
    /// (SourceType="OpeningBalance", SourceId=ContactId).
    /// </summary>
    Task<Result<OpeningBalanceImportResultDto>> ImportAsync(
        ImportOpeningBalancesRequest request,
        CancellationToken ct = default);
}
