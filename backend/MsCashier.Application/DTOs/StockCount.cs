namespace MsCashier.Application.DTOs;

// ==================== Stock Count ====================

public record StockCountDto(
    int Id, int WarehouseId, string WarehouseName, string Status,
    string? Notes, DateTime CreatedAt, DateTime? CompletedAt,
    int TotalItems, int CountedItems, int SettledItems);

public record StockCountItemDto(
    long Id, int ProductId, string ProductName, string? Barcode,
    decimal SystemQty, decimal CountedQty, decimal Variance,
    string Status, bool IsSettled, string? Notes);

public record StartStockCountRequest(int WarehouseId, string? Notes);

public record ScanProductRequest(int ProductId, decimal Quantity = 1);

public record SettleItemRequest(string? Notes);

public record BulkOpeningBalanceRow(int ProductId, int WarehouseId, decimal Quantity);

public record BulkOpeningBalanceRequest(List<BulkOpeningBalanceRow> Items, string? Notes);
