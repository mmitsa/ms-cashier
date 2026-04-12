using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Kitchen Station DTOs
// ============================================================

public record KitchenStationDto(
    int Id, string Code, string Name, string StationType,
    int DisplayOrder, string Color, bool IsActive,
    int MaxConcurrentOrders, int AveragePreparationMinutes,
    int? BranchId, int ProductCount, int ActiveOrderCount);

public record SaveKitchenStationRequest(
    string Code, string Name, string StationType,
    int DisplayOrder, string? Color, bool IsActive,
    int MaxConcurrentOrders, int AveragePreparationMinutes,
    int? BranchId);

public record ProductKitchenStationDto(
    int Id, int ProductId, string ProductName,
    int KitchenStationId, string StationName,
    int Priority, int? EstimatedPrepMinutes);

public record AssignProductToStationRequest(
    int ProductId, int KitchenStationId,
    int Priority, int? EstimatedPrepMinutes);

