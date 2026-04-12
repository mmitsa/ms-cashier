using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Food Cost Report DTOs
// ============================================================

public record FoodCostReportDto(
    decimal TotalFoodCost, decimal TotalRevenue, decimal OverallFoodCostPercent,
    List<FoodCostItemDto> Items);

public record FoodCostItemDto(
    int ProductId, string ProductName, string? CategoryName,
    decimal TheoreticalCost, decimal SellingPrice,
    decimal FoodCostPercent, decimal? TargetFoodCostPercent,
    int QtySold, decimal TotalCostOfGoodsSold, decimal TotalRevenue);

