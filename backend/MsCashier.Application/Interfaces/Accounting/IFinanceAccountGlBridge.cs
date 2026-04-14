using MsCashier.Domain.Entities;

namespace MsCashier.Application.Interfaces.Accounting;

public interface IFinanceAccountGlBridge
{
    /// <summary>
    /// Resolves (or creates) the GL leaf ChartOfAccount that mirrors this FinanceAccount.
    /// Auto-creates under the right parent group based on AccountType.
    /// Idempotent: if FinanceAccount.ChartOfAccountId already set, returns it without creating.
    /// Returns the GL account id.
    /// </summary>
    Task<int> EnsureGlAccountAsync(FinanceAccount account, CancellationToken ct = default);
}
