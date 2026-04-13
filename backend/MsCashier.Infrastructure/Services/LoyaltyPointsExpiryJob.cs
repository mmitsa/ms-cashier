using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MsCashier.Domain.Entities;
using MsCashier.Infrastructure.Data;

namespace MsCashier.Infrastructure.Services;

/// <summary>
/// Runs once per day. Finds earned loyalty points that have expired and creates
/// offsetting Expire transactions, deducting from CustomerLoyalty.CurrentPoints.
/// </summary>
public class LoyaltyPointsExpiryJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LoyaltyPointsExpiryJob> _logger;

    public LoyaltyPointsExpiryJob(IServiceProvider serviceProvider, ILogger<LoyaltyPointsExpiryJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("LoyaltyPointsExpiryJob started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredPointsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LoyaltyPointsExpiryJob encountered an error.");
            }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task ProcessExpiredPointsAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;

        // Find Earn transactions that have expired and don't already have a matching Expire transaction.
        var expiredEarns = await db.LoyaltyTransactions
            .IgnoreQueryFilters()
            .Where(t => !t.IsDeleted
                && t.Type == LoyaltyTransactionType.Earn
                && t.ExpiresAt != null
                && t.ExpiresAt < now)
            .ToListAsync(ct);

        if (expiredEarns.Count == 0)
        {
            _logger.LogDebug("LoyaltyPointsExpiryJob: No expired points found.");
            return;
        }

        // Get all existing Expire transactions to avoid duplicates.
        // We match by CustomerLoyaltyId + Description containing the original transaction Id.
        var expiredEarnIds = expiredEarns.Select(e => e.Id).ToHashSet();
        var existingExpiries = await db.LoyaltyTransactions
            .IgnoreQueryFilters()
            .Where(t => !t.IsDeleted
                && t.Type == LoyaltyTransactionType.Expire)
            .Select(t => t.Description)
            .ToListAsync(ct);

        // Build a set of original Earn Ids that already have an Expire transaction.
        var alreadyExpiredIds = new HashSet<long>();
        foreach (var desc in existingExpiries)
        {
            if (desc != null && desc.StartsWith("Expired earn #") &&
                long.TryParse(desc.AsSpan("Expired earn #".Length), out var earnId))
            {
                alreadyExpiredIds.Add(earnId);
            }
        }

        var processed = 0;

        foreach (var earn in expiredEarns)
        {
            if (alreadyExpiredIds.Contains(earn.Id))
                continue;

            // Create offsetting Expire transaction
            var expireTx = new LoyaltyTransaction
            {
                TenantId = earn.TenantId,
                CustomerLoyaltyId = earn.CustomerLoyaltyId,
                Type = LoyaltyTransactionType.Expire,
                Points = earn.Points,
                Description = $"Expired earn #{earn.Id}",
            };
            db.LoyaltyTransactions.Add(expireTx);

            // Deduct from CustomerLoyalty.CurrentPoints
            var loyalty = await db.CustomerLoyalties
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(cl => cl.Id == earn.CustomerLoyaltyId && !cl.IsDeleted, ct);

            if (loyalty != null)
            {
                loyalty.CurrentPoints = Math.Max(0, loyalty.CurrentPoints - earn.Points);
            }

            processed++;
        }

        if (processed > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("LoyaltyPointsExpiryJob: Expired {Count} loyalty point transactions.", processed);
        }
    }
}
