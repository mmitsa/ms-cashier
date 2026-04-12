using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Production Waste DTOs
// ============================================================

public record ProductionWasteDto(
    long Id, int? ProductionOrderId, string? ProductionOrderCode,
    string WasteType, int ProductId, string ProductName,
    decimal Quantity, int? UnitId, string? UnitName,
    decimal EstimatedCost, string? Reason,
    Guid ReportedByUserId, string? ReportedByName,
    DateTime ReportedAt, int? BranchId);

public record CreateWasteRequest(
    int? ProductionOrderId, string WasteType,
    int ProductId, decimal Quantity, int? UnitId,
    decimal? EstimatedCost, string? Reason, int? BranchId);

public record WasteFilterRequest(
    string? WasteType, int? ProductId,
    int? ProductionOrderId, DateTime? DateFrom, DateTime? DateTo,
    int Page = 1, int PageSize = 50);

public record WasteSummaryDto(
    decimal TotalWasteCost, int TotalWasteCount,
    List<WasteByTypeDto> ByType, List<WasteByProductDto> TopProducts);

public record WasteByTypeDto(string WasteType, int Count, decimal TotalQuantity, decimal TotalCost);
public record WasteByProductDto(int ProductId, string ProductName, int Count, decimal TotalQuantity, decimal TotalCost);

