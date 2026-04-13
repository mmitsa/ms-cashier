namespace MsCashier.Application.DTOs;

/// <summary>Stock level for one product in one warehouse</summary>
public record ProductWarehouseStockDto(
    int WarehouseId,
    string WarehouseName,
    decimal Quantity,
    decimal ReservedQty,
    decimal AvailableQty,
    DateTime LastUpdated);

/// <summary>Inventory overview dashboard stats</summary>
public record InventoryDashboardDto(
    int TotalProducts,
    int TotalWarehouses,
    decimal TotalStockValue,
    int LowStockCount,
    int OutOfStockCount,
    List<WarehouseStockSummaryDto> WarehouseSummaries);

/// <summary>Summary per warehouse</summary>
public record WarehouseStockSummaryDto(
    int WarehouseId,
    string WarehouseName,
    int ProductCount,
    decimal TotalQuantity,
    decimal TotalValue);
