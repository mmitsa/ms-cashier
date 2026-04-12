using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Recipe DTOs
// ============================================================

public record RecipeDto(
    int Id, string Code, string Name, string? Description,
    string RecipeType, string Status,
    int? ProductId, string? ProductName, int? CategoryId, string? CategoryName,
    decimal YieldQuantity, int? YieldUnitId, string? YieldUnitName,
    int PreparationTimeMinutes, int CookingTimeMinutes,
    int? ShelfLifeHours, string? StorageInstructions, string? Instructions,
    int Version, bool IsCurrentVersion,
    decimal? TargetFoodCostPercent, decimal CalculatedCost,
    decimal CalculatedFoodCostPercent, DateTime? LastCostCalculationAt,
    int? BranchId, DateTime CreatedAt,
    List<RecipeIngredientDto> Ingredients);

public record RecipeIngredientDto(
    int Id, string IngredientType,
    int? RawMaterialId, string? RawMaterialName,
    int? SubRecipeId, string? SubRecipeName,
    decimal Quantity, int? UnitId, string? UnitName,
    decimal WastePercent, decimal GrossQuantity,
    decimal UnitCost, decimal TotalCost,
    int SortOrder, bool IsOptional, string? Notes);

public record CreateRecipeRequest(
    string Name, string? Description,
    string RecipeType, int? ProductId, int? CategoryId,
    decimal YieldQuantity, int? YieldUnitId,
    int PreparationTimeMinutes, int CookingTimeMinutes,
    int? ShelfLifeHours, string? StorageInstructions, string? Instructions,
    decimal? TargetFoodCostPercent, int? BranchId,
    List<SaveRecipeIngredientRequest> Ingredients);

public record UpdateRecipeRequest(
    string? Name, string? Description,
    int? ProductId, int? CategoryId,
    decimal? YieldQuantity, int? YieldUnitId,
    int? PreparationTimeMinutes, int? CookingTimeMinutes,
    int? ShelfLifeHours, string? StorageInstructions, string? Instructions,
    decimal? TargetFoodCostPercent,
    List<SaveRecipeIngredientRequest>? Ingredients);

public record SaveRecipeIngredientRequest(
    string IngredientType,
    int? RawMaterialId, int? SubRecipeId,
    decimal Quantity, int? UnitId,
    decimal WastePercent, int SortOrder,
    bool IsOptional, string? Notes);

public record RecipeSearchRequest(
    string? SearchTerm, string? RecipeType, string? Status,
    int? CategoryId, int? ProductId,
    int Page = 1, int PageSize = 50);

public record RecipeCostSummaryDto(
    int RecipeId, string RecipeName,
    decimal TotalBatchCost, decimal CostPerPortion,
    decimal SellingPrice, decimal FoodCostPercent,
    decimal? TargetFoodCostPercent, bool IsAboveTarget,
    List<RecipeIngredientCostDto> IngredientCosts);

public record RecipeIngredientCostDto(
    string IngredientName, decimal Quantity, string? UnitName,
    decimal WastePercent, decimal GrossQuantity,
    decimal UnitCost, decimal TotalCost, decimal CostPercent);

