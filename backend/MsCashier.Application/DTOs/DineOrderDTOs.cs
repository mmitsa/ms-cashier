using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Dine Order DTOs
// ============================================================

public record DineOrderDto(
    long Id, string OrderNumber, string OrderType, string Status,
    int? TableId, string? TableNumber, int? GuestCount,
    string? CustomerName, string? CustomerPhone, string? DeliveryAddress,
    decimal SubTotal, decimal DiscountAmount, decimal TaxAmount, decimal TotalAmount,
    string? Notes, Guid WaiterId, string? WaiterName,
    long? InvoiceId, DateTime? KitchenSentAt, DateTime? ReadyAt,
    DateTime? ServedAt, DateTime? BilledAt, DateTime CreatedAt,
    List<DineOrderItemDto> Items);

public record DineOrderItemDto(
    long Id, int ProductId, string ProductName, string? ProductBarcode,
    decimal Quantity, decimal UnitPrice, decimal TotalPrice,
    string KitchenStatus, string? SpecialNotes,
    DateTime? SentToKitchenAt, DateTime? ReadyAt);

public record CreateDineOrderRequest(
    string OrderType, int? TableId, int? GuestCount,
    string? CustomerName, string? CustomerPhone, string? DeliveryAddress,
    string? Notes, List<CreateDineOrderItemRequest> Items);

public record CreateDineOrderItemRequest(
    int ProductId, decimal Quantity, string? SpecialNotes);

public record AddItemsToOrderRequest(List<CreateDineOrderItemRequest> Items);

public record UpdateOrderItemStatusRequest(string KitchenStatus);

public record BillOrderRequest(int PaymentMethod, int WarehouseId, decimal? PaidAmount, decimal? DiscountAmount);

