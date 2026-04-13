using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 10. DashboardService
// ════════════════════════════════════════════════════════════════

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public DashboardService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<DashboardDto>> GetDashboardAsync(DateTime date)
    {
        try
        {
            var todayStart = date.Date;
            var todayEnd = todayStart.AddDays(1);

            // Today's sales
            var todaySales = await _uow.Repository<Invoice>().Query()
                .AsNoTracking()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.InvoiceType == InvoiceType.Sale &&
                    i.InvoiceDate >= todayStart &&
                    i.InvoiceDate < todayEnd &&
                    !i.IsDeleted)
                .SumAsync(i => i.TotalAmount);

            // Today's invoice count
            var todayInvoices = await _uow.Repository<Invoice>().Query()
                .AsNoTracking()
                .CountAsync(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.InvoiceType == InvoiceType.Sale &&
                    i.InvoiceDate >= todayStart &&
                    i.InvoiceDate < todayEnd &&
                    !i.IsDeleted);

            // Today's profit
            var todayInvoiceIds = await _uow.Repository<Invoice>().Query()
                .AsNoTracking()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.InvoiceType == InvoiceType.Sale &&
                    i.InvoiceDate >= todayStart &&
                    i.InvoiceDate < todayEnd &&
                    !i.IsDeleted)
                .Select(i => i.Id)
                .ToListAsync();

            decimal todayProfit = 0;
            if (todayInvoiceIds.Count > 0)
            {
                todayProfit = await _uow.Repository<InvoiceItem>().Query()
                    .Where(ii => todayInvoiceIds.Contains(ii.InvoiceId))
                    .SumAsync(ii => (ii.UnitPrice - ii.CostPrice) * ii.Quantity - ii.DiscountAmount);
            }

            var profitMargin = todaySales > 0 ? Math.Round(todayProfit / todaySales * 100, 2) : 0;

            // New customers today
            var newCustomers = await _uow.Repository<Contact>().Query()
                .AsNoTracking()
                .CountAsync(c =>
                    c.TenantId == _tenant.TenantId &&
                    c.ContactType == ContactType.Customer &&
                    c.CreatedAt >= todayStart &&
                    c.CreatedAt < todayEnd &&
                    !c.IsDeleted);

            // Low stock items
            var lowStockProducts = await _uow.Repository<Product>().Query()
                .AsNoTracking()
                .Where(p =>
                    p.TenantId == _tenant.TenantId &&
                    !p.IsDeleted &&
                    p.IsActive &&
                    p.TrackInventory)
                .GroupJoin(
                    _uow.Repository<Inventory>().Query()
                        .Where(i => i.TenantId == _tenant.TenantId),
                    p => p.Id,
                    i => i.ProductId,
                    (p, inventories) => new { Product = p, Inventories = inventories })
                .SelectMany(
                    x => x.Inventories.DefaultIfEmpty(),
                    (x, inv) => new { x.Product, Inventory = inv })
                .GroupBy(x => new { x.Product.Id, x.Product.Name, x.Product.Barcode, x.Product.MinStock })
                .Select(g => new
                {
                    g.Key.Id,
                    g.Key.Name,
                    g.Key.Barcode,
                    Quantity = g.Sum(x => x.Inventory != null ? x.Inventory.Quantity : 0),
                    g.Key.MinStock
                })
                .Where(x => x.Quantity <= x.MinStock)
                .OrderBy(x => x.Quantity)
                .Take(10)
                .ToListAsync();

            var lowStockItems = lowStockProducts.Select(p => new LowStockProductDto(
                p.Id, p.Name, p.Barcode, p.Quantity, (int)p.MinStock
            )).ToList();

            var lowStockCount = lowStockItems.Count;

            // Top products (this week)
            var weekStart = todayStart.AddDays(-(int)todayStart.DayOfWeek);
            var weekEnd = weekStart.AddDays(7);

            var weekInvoiceIds = await _uow.Repository<Invoice>().Query()
                .AsNoTracking()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.InvoiceType == InvoiceType.Sale &&
                    i.InvoiceDate >= weekStart &&
                    i.InvoiceDate < weekEnd &&
                    !i.IsDeleted)
                .Select(i => i.Id)
                .ToListAsync();

            var topProducts = new List<TopProductDto>();
            if (weekInvoiceIds.Count > 0)
            {
                var topProductData = await _uow.Repository<InvoiceItem>().Query()
                    .Where(ii => weekInvoiceIds.Contains(ii.InvoiceId))
                    .GroupBy(ii => ii.ProductId)
                    .Select(g => new
                    {
                        ProductId = g.Key,
                        TotalQty = g.Sum(ii => ii.Quantity),
                        TotalRevenue = g.Sum(ii => ii.TotalPrice)
                    })
                    .OrderByDescending(x => x.TotalRevenue)
                    .Take(5)
                    .ToListAsync();

                var topProductIds = topProductData.Select(x => x.ProductId).ToList();
                var productNames = await _uow.Repository<Product>().Query()
                    .Where(p => topProductIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, p => p.Name);

                topProducts = topProductData.Select(x => new TopProductDto(
                    x.ProductId,
                    productNames.ContainsKey(x.ProductId) ? productNames[x.ProductId] : "",
                    x.TotalQty, x.TotalRevenue
                )).ToList();
            }

            // Weekly sales trend (last 7 days)
            var weeklySales = new List<DailySalesDto>();
            for (int i = 6; i >= 0; i--)
            {
                var dayStart = todayStart.AddDays(-i);
                var dayEnd = dayStart.AddDays(1);

                var dayData = await _uow.Repository<Invoice>().Query()
                    .Where(inv =>
                        inv.TenantId == _tenant.TenantId &&
                        inv.InvoiceType == InvoiceType.Sale &&
                        inv.InvoiceDate >= dayStart &&
                        inv.InvoiceDate < dayEnd &&
                        !inv.IsDeleted)
                    .GroupBy(inv => 1)
                    .Select(g => new
                    {
                        Count = g.Count(),
                        Total = g.Sum(inv => inv.TotalAmount)
                    })
                    .FirstOrDefaultAsync();

                weeklySales.Add(new DailySalesDto(
                    dayStart,
                    dayData?.Count ?? 0,
                    dayData?.Total ?? 0
                ));
            }

            var dashboard = new DashboardDto(
                todaySales, todayInvoices, todayProfit, profitMargin,
                newCustomers, lowStockCount,
                topProducts, lowStockItems, weeklySales);

            return Result<DashboardDto>.Success(dashboard);
        }
        catch (Exception ex)
        {
            return Result<DashboardDto>.Failure($"خطأ: {ex.Message}");
        }
    }
}

// ════════════════════════════════════════════════════════════════
// 11. ReportService
// ════════════════════════════════════════════════════════════════

