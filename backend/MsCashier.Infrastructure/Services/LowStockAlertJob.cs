using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MsCashier.Domain.Entities;
using MsCashier.Infrastructure.Data;

namespace MsCashier.Infrastructure.Services;

/// <summary>
/// Runs every hour. Checks all products where current stock is at or below MinStock
/// and sends a notification. Avoids duplicate notifications by checking if one was
/// already sent today for the same product.
/// </summary>
public class LowStockAlertJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LowStockAlertJob> _logger;

    public LowStockAlertJob(IServiceProvider serviceProvider, ILogger<LowStockAlertJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("LowStockAlertJob started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckLowStockAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LowStockAlertJob encountered an error.");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task CheckLowStockAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var todayStart = DateTime.UtcNow.Date;

        // Aggregate stock per product across all warehouses, join with product MinStock.
        var lowStockItems = await db.Inventories
            .IgnoreQueryFilters()
            .Include(i => i.Product)
            .Where(i => i.Product != null
                && i.Product.IsActive
                && !i.Product.IsDeleted
                && i.Product.TrackInventory)
            .GroupBy(i => new { i.ProductId, i.TenantId, ProductName = i.Product!.Name, i.Product.MinStock })
            .Select(g => new
            {
                g.Key.ProductId,
                g.Key.TenantId,
                g.Key.ProductName,
                g.Key.MinStock,
                TotalQty = g.Sum(x => x.Quantity)
            })
            .Where(x => x.TotalQty <= x.MinStock)
            .ToListAsync(ct);

        if (lowStockItems.Count == 0)
        {
            _logger.LogDebug("LowStockAlertJob: No low-stock products found.");
            return;
        }

        // Check which products already have a low-stock notification today to avoid duplicates.
        var alreadyNotifiedKeys = await db.Notifications
            .IgnoreQueryFilters()
            .Where(n => !n.IsDeleted
                && n.Type == "low-stock"
                && n.EntityType == "Product"
                && n.CreatedAt >= todayStart)
            .Select(n => new { n.TenantId, n.EntityId })
            .ToListAsync(ct);

        var notifiedSet = alreadyNotifiedKeys
            .Select(x => $"{x.TenantId}:{x.EntityId}")
            .ToHashSet();

        var created = 0;

        foreach (var item in lowStockItems)
        {
            if (ct.IsCancellationRequested) break;

            var key = $"{item.TenantId}:{item.ProductId}";
            if (notifiedSet.Contains(key))
                continue;

            var notification = new Notification
            {
                TenantId = item.TenantId,
                UserId = null, // broadcast to all users in tenant
                Title = $"تنبيه: مخزون منخفض - {item.ProductName}",
                Body = $"الكمية الحالية {item.TotalQty:N2} أقل من أو تساوي الحد الأدنى {item.MinStock:N2}.",
                Type = "low-stock",
                EntityType = "Product",
                EntityId = item.ProductId.ToString(),
                IsRead = false,
            };
            db.Notifications.Add(notification);
            created++;
        }

        if (created > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("LowStockAlertJob: Created {Count} low-stock notifications.", created);
        }
    }
}
