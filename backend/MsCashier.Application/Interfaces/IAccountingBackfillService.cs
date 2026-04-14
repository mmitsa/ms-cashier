using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public record AccountingBackfillRow(Guid TenantId, string TenantName, int AccountsCreated, bool PeriodCreated, string? Error);

public record AccountingBackfillResultDto(int TenantsProcessed, int TenantsSucceeded, int TenantsFailed, IReadOnlyList<AccountingBackfillRow> Rows);

public interface IAccountingBackfillService
{
    /// <summary>
    /// Finds every tenant that has zero rows in ChartOfAccounts and seeds the default CoA
    /// plus an AccountingPeriod for the current month. Each tenant is processed in its own
    /// sub-transaction; a failure on one tenant does not abort the rest.
    /// </summary>
    Task<Result<AccountingBackfillResultDto>> BackfillAllMissingAsync(CancellationToken ct = default);
}
