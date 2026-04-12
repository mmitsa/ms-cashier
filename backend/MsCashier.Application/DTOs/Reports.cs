using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Reports
public record SalesReportDto(decimal TotalSales, decimal TotalReturns, decimal NetSales, int InvoiceCount, List<SalesReportItemDto> Items);
public record SalesReportItemDto(DateTime Date, int InvoiceCount, decimal TotalAmount, decimal TotalCost, decimal Profit);
public record ProfitReportDto(decimal TotalRevenue, decimal TotalCost, decimal GrossProfit, decimal ProfitMargin, List<ProductProfitDto> Products);
public record ProductProfitDto(int ProductId, string Name, decimal TotalQty, decimal Revenue, decimal Cost, decimal Profit, decimal Margin);

