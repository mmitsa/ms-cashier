using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Kitchen Display
public record KitchenOrderDto(
    long OrderId, string OrderNumber, string OrderType,
    string? TableNumber, int? GuestCount, string? WaiterName,
    DateTime OrderTime, int MinutesElapsed,
    List<KitchenItemDto> Items);

public record KitchenItemDto(
    long ItemId, string ProductName, decimal Quantity,
    string? SpecialNotes, string KitchenStatus);

