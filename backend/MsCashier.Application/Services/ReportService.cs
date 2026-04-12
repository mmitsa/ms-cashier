using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 11. ReportService
// ════════════════════════════════════════════════════════════════

public class ReportService : IReportService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public ReportService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<SalesReportDto>> GetSalesReportAsync(DateTime from, DateTime to, int? categoryId, int? contactId)
    {
        try
        {
            var fromDate = from.Date;
            var toDate = to.Date.AddDays(1);

            var salesQuery = _uow.Repository<Invoice>().Query()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.InvoiceType == InvoiceType.Sale &&
                    i.InvoiceDate >= fromDate &&
                    i.InvoiceDate < toDate &&
                    !i.IsDeleted);

            var returnsQuery = _uow.Repository<Invoice>().Query()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.InvoiceType == InvoiceType.SaleReturn &&
                    i.InvoiceDate >= fromDate &&
                    i.InvoiceDate < toDate &&
                    !i.IsDeleted);

            if (contactId.HasValue)
            {
                salesQuery = salesQuery.Where(i => i.ContactId == contactId.Value);
                returnsQuery = returnsQuery.Where(i => i.ContactId == contactId.Value);
            }

            // Filter by category if specified
            if (categoryId.HasValue)
            {
                var productsInCategory = await _uow.Repository<Product>().Query()
                    .Where(p =>
                        p.TenantId == _tenant.TenantId &&
                        p.CategoryId == categoryId.Value)
                    .Select(p => p.Id)
                    .ToListAsync();

                var filteredInvoiceIds = await _uow.Repository<InvoiceItem>().Query()
                    .Where(ii => productsInCategory.Contains(ii.ProductId))
                    .Select(ii => ii.InvoiceId)
                    .Distinct()
                    .ToListAsync();

                salesQuery = salesQuery.Where(i => filteredInvoiceIds.Contains(i.Id));
            }

            var totalSales = await salesQuery.SumAsync(i => i.TotalAmount);
            var totalReturns = await returnsQuery.SumAsync(i => i.TotalAmount);
            var netSales = totalSales - totalReturns;
            var invoiceCount = await salesQuery.CountAsync();

            // Group by date
            var dailyData = await salesQuery
                .GroupBy(i => i.InvoiceDate.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    InvoiceCount = g.Count(),
                    TotalAmount = g.Sum(i => i.TotalAmount)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            // Get cost data
            var salesInvoiceIds = await salesQuery.Select(i => i.Id).ToListAsync();

            var costByInvoice = new Dictionary<long, decimal>();
            if (salesInvoiceIds.Count > 0)
            {
                var itemCosts = await _uow.Repository<InvoiceItem>().Query()
                    .Where(ii => salesInvoiceIds.Contains(ii.InvoiceId))
                    .GroupBy(ii => ii.InvoiceId)
                    .Select(g => new
                    {
                        InvoiceId = g.Key,
                        TotalCost = g.Sum(ii => ii.CostPrice * ii.Quantity)
                    })
                    .ToListAsync();

                costByInvoice = itemCosts.ToDictionary(x => x.InvoiceId, x => x.TotalCost);
            }

            var invoiceDates = await salesQuery
                .Select(i => new { i.Id, Date = i.InvoiceDate.Date })
                .ToListAsync();

            var costByDate = invoiceDates
                .GroupBy(x => x.Date)
                .ToDictionary(
                    g => g.Key,
                    g => g.Sum(x => costByInvoice.ContainsKey(x.Id) ? costByInvoice[x.Id] : 0));

            var items = dailyData.Select(d => new SalesReportItemDto(
                d.Date, d.InvoiceCount, d.TotalAmount,
                costByDate.ContainsKey(d.Date) ? costByDate[d.Date] : 0,
                d.TotalAmount - (costByDate.ContainsKey(d.Date) ? costByDate[d.Date] : 0)
            )).ToList();

            var report = new SalesReportDto(totalSales, totalReturns, netSales, invoiceCount, items);
            return Result<SalesReportDto>.Success(report);
        }
        catch (Exception ex)
        {
            return Result<SalesReportDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ProfitReportDto>> GetProfitReportAsync(DateTime from, DateTime to, int? productId)
    {
        try
        {
            var fromDate = from.Date;
            var toDate = to.Date.AddDays(1);

            var saleInvoiceIds = await _uow.Repository<Invoice>().Query()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.InvoiceType == InvoiceType.Sale &&
                    i.InvoiceDate >= fromDate &&
                    i.InvoiceDate < toDate &&
                    !i.IsDeleted)
                .Select(i => i.Id)
                .ToListAsync();

            if (saleInvoiceIds.Count == 0)
            {
                return Result<ProfitReportDto>.Success(new ProfitReportDto(
                    0, 0, 0, 0, new List<ProductProfitDto>()));
            }

            var itemsQuery = _uow.Repository<InvoiceItem>().Query()
                .Where(ii => saleInvoiceIds.Contains(ii.InvoiceId));

            if (productId.HasValue)
                itemsQuery = itemsQuery.Where(ii => ii.ProductId == productId.Value);

            var productData = await itemsQuery
                .GroupBy(ii => ii.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    TotalQty = g.Sum(ii => ii.Quantity),
                    Revenue = g.Sum(ii => ii.TotalPrice),
                    Cost = g.Sum(ii => ii.CostPrice * ii.Quantity)
                })
                .OrderByDescending(x => x.Revenue - x.Cost)
                .ToListAsync();

            var totalRevenue = productData.Sum(x => x.Revenue);
            var totalCost = productData.Sum(x => x.Cost);
            var grossProfit = totalRevenue - totalCost;
            var profitMargin = totalRevenue > 0 ? Math.Round(grossProfit / totalRevenue * 100, 2) : 0;

            var pIds = productData.Select(x => x.ProductId).ToList();
            var productNames = await _uow.Repository<Product>().Query()
                .Where(p => pIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.Name);

            var products = productData.Select(x =>
            {
                var profit = x.Revenue - x.Cost;
                var margin = x.Revenue > 0 ? Math.Round(profit / x.Revenue * 100, 2) : 0;
                return new ProductProfitDto(
                    x.ProductId,
                    productNames.ContainsKey(x.ProductId) ? productNames[x.ProductId] : "",
                    x.TotalQty, x.Revenue, x.Cost, profit, margin);
            }).ToList();

            var report = new ProfitReportDto(totalRevenue, totalCost, grossProfit, profitMargin, products);
            return Result<ProfitReportDto>.Success(report);
        }
        catch (Exception ex)
        {
            return Result<ProfitReportDto>.Failure($"خطأ: {ex.Message}");
        }
    }
}

// ════════════════════════════════════════════════════════════════
// 12. InventoryService
// ════════════════════════════════════════════════════════════════

