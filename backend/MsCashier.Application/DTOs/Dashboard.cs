using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Dashboard
public record DashboardDto(decimal TodaySales, int TodayInvoices, decimal TodayProfit, decimal ProfitMargin, int NewCustomers, int LowStockCount, List<TopProductDto> TopProducts, List<LowStockProductDto> LowStockItems, List<DailySalesDto> WeeklySales);
public record TopProductDto(int Id, string Name, decimal TotalQty, decimal TotalRevenue);
public record LowStockProductDto(int Id, string Name, string? Barcode, decimal Quantity, int MinStock);
public record DailySalesDto(DateTime Date, int InvoiceCount, decimal Total);

