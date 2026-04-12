using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Production Order DTOs
// ============================================================

public record ProductionOrderDto(
    int Id, string Code, int RecipeId, string RecipeName,
    decimal PlannedQuantity, int? PlannedUnitId, string? PlannedUnitName,
    decimal? ActualQuantity, string Status, string Priority,
    DateTime? PlannedStartDate, DateTime? PlannedEndDate,
    DateTime? ActualStartDate, DateTime? ActualEndDate,
    Guid? AssignedToUserId, string? AssignedToName,
    Guid? ApprovedByUserId, string? ApprovedByName, DateTime? ApprovedAt,
    string? Notes, int? TargetWarehouseId, string? TargetWarehouseName,
    int? SourceWarehouseId, string? SourceWarehouseName,
    string? BatchNumber, DateTime? ExpiryDate,
    decimal EstimatedCost, decimal? ActualCost,
    int? BranchId, DateTime CreatedAt,
    List<ProductionOrderItemDto> Items);

public record ProductionOrderItemDto(
    int Id, int ProductId, string ProductName,
    decimal RequiredQuantity, int? UnitId, string? UnitName,
    decimal? ActualQuantityUsed, decimal UnitCost, decimal TotalCost,
    string? Notes);

public record CreateProductionOrderRequest(
    int RecipeId, decimal PlannedQuantity, int? PlannedUnitId,
    string? Priority, DateTime? PlannedStartDate, DateTime? PlannedEndDate,
    Guid? AssignedToUserId, string? Notes,
    int? TargetWarehouseId, int? SourceWarehouseId,
    string? BatchNumber, DateTime? ExpiryDate, int? BranchId);

public record UpdateProductionOrderRequest(
    decimal? PlannedQuantity, string? Priority,
    DateTime? PlannedStartDate, DateTime? PlannedEndDate,
    Guid? AssignedToUserId, string? Notes,
    int? TargetWarehouseId, int? SourceWarehouseId,
    string? BatchNumber, DateTime? ExpiryDate);

public record CompleteProductionRequest(
    decimal ActualQuantity,
    List<ProductionItemActualRequest>? ItemActuals);

public record ProductionItemActualRequest(int ItemId, decimal ActualQuantityUsed);

public record ProductionOrderFilterRequest(
    string? Status, string? Priority,
    int? RecipeId, DateTime? DateFrom, DateTime? DateTo,
    int Page = 1, int PageSize = 50);

