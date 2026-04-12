using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Kitchen Stats
public record KitchenStatsDto(
    int ActiveOrders, int PreparingItems, int ReadyItems, int UrgentOrders,
    double AvgPrepTimeMinutes, int CompletedToday, int CancelledToday);

public record CompletedKitchenOrderDto(
    long OrderId, string OrderNumber, string OrderType,
    string? TableNumber, string? WaiterName,
    DateTime CompletedAt, int PrepTimeMinutes, int ItemCount);

