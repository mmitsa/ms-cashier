using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Warehouse
public record WarehouseDto(int Id, string Name, string? Location, bool IsMain, int TotalItems, decimal TotalValue);
public record CreateWarehouseRequest(string Name, string? Location, bool IsMain);
public record StockTransferRequest(int FromWarehouseId, int ToWarehouseId, string? Notes, List<TransferItemRequest> Items);
public record TransferItemRequest(int ProductId, decimal Quantity);

