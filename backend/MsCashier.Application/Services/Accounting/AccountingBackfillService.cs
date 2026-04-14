using Microsoft.EntityFrameworkCore;
using MsCashier.Application.Accounting;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting;

/// <summary>
/// One-shot backfill that seeds the default Chart of Accounts and an AccountingPeriod
/// for every existing tenant that has no CoA rows yet.
///
/// Tenant-stamping strategy: We explicitly set <c>TenantId</c> on every seeded entity
/// (via <see cref="DefaultChartOfAccounts.BuildEntities"/> and when building the
/// <see cref="AccountingPeriod"/>). <c>EnforceTenantInvariantsBeforeSave</c> in
/// <c>AppDbContext</c> only auto-assigns TenantId when it is <c>Guid.Empty</c>; it does
/// NOT overwrite a TenantId that is already populated, and it does NOT compare against
/// <c>ICurrentTenantService</c> on insert. This means a single DbContext can insert rows
/// for many tenants in sequence as long as TenantId is pre-set — no swapped scope
/// required. Query filters are bypassed via <c>QueryUnfiltered()</c>.
/// </summary>
public class AccountingBackfillService : IAccountingBackfillService
{
    private readonly IUnitOfWork _uow;

    public AccountingBackfillService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Result<AccountingBackfillResultDto>> BackfillAllMissingAsync(CancellationToken ct = default)
    {
        try
        {
            // Tenants that have at least one CoA row (cross-tenant, unfiltered).
            var tenantsWithCoa = await _uow.Repository<ChartOfAccount>().QueryUnfiltered()
                .Select(a => a.TenantId)
                .Distinct()
                .ToListAsync(ct);

            var tenantsWithCoaSet = new HashSet<Guid>(tenantsWithCoa);

            // All tenants (unfiltered; excluded soft-deleted).
            var missingTenants = await _uow.Repository<Tenant>().QueryUnfiltered()
                .Where(t => !t.IsDeleted)
                .Select(t => new { t.Id, t.Name })
                .ToListAsync(ct);

            var rows = new List<AccountingBackfillRow>();
            int succeeded = 0;
            int failed = 0;

            foreach (var tenant in missingTenants)
            {
                if (tenantsWithCoaSet.Contains(tenant.Id))
                    continue; // already has CoA — skip

                var (row, ok) = await BackfillSingleAsync(tenant.Id, tenant.Name, ct);
                rows.Add(row);
                if (ok) succeeded++; else failed++;
            }

            var dto = new AccountingBackfillResultDto(
                TenantsProcessed: rows.Count,
                TenantsSucceeded: succeeded,
                TenantsFailed: failed,
                Rows: rows);

            return Result<AccountingBackfillResultDto>.Success(dto, $"تمت معالجة {rows.Count} تينانت ({succeeded} نجاح / {failed} فشل)");
        }
        catch (Exception ex)
        {
            return Result<AccountingBackfillResultDto>.Failure($"فشل تنفيذ backfill: {ex.Message}");
        }
    }

    private async Task<(AccountingBackfillRow Row, bool Ok)> BackfillSingleAsync(Guid tenantId, string tenantName, CancellationToken ct)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var accounts = DefaultChartOfAccounts.BuildEntities(tenantId);
            // BuildEntities already stamps TenantId; re-assert in case of drift.
            foreach (var a in accounts)
                a.TenantId = tenantId;

            await _uow.Repository<ChartOfAccount>().AddRangeAsync(accounts);

            var now = DateTime.UtcNow;
            var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var periodEnd = periodStart.AddMonths(1).AddSeconds(-1);
            var period = new AccountingPeriod
            {
                TenantId = tenantId,
                Name = $"{now:yyyy-MM}",
                StartDate = periodStart,
                EndDate = periodEnd,
                FiscalYear = now.Year,
                IsClosed = false
            };
            await _uow.Repository<AccountingPeriod>().AddAsync(period);

            await _uow.SaveChangesAsync(ct);
            await _uow.CommitTransactionAsync();

            return (new AccountingBackfillRow(tenantId, tenantName, accounts.Count, true, null), true);
        }
        catch (Exception ex)
        {
            try { await _uow.RollbackTransactionAsync(); } catch { /* ignore */ }
            return (new AccountingBackfillRow(tenantId, tenantName, 0, false, ex.Message), false);
        }
    }
}
