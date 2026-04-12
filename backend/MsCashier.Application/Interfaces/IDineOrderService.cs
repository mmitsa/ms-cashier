using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Dine / Waiter Order
// ============================================================

public interface IDineOrderService
{
    // Order lifecycle
    Task<Result<DineOrderDto>> CreateOrderAsync(CreateDineOrderRequest dto);
    Task<Result<DineOrderDto>> GetByIdAsync(long id);
    Task<Result<List<DineOrderDto>>> GetActiveOrdersAsync();
    Task<Result<List<DineOrderDto>>> GetOrdersByTableAsync(int tableId);
    Task<Result<DineOrderDto>> AddItemsAsync(long orderId, AddItemsToOrderRequest dto);
    Task<Result<DineOrderDto>> SendToKitchenAsync(long orderId);
    Task<Result<DineOrderDto>> MarkServedAsync(long orderId);
    Task<Result<DineOrderDto>> CancelOrderAsync(long orderId);

    // Kitchen
    Task<Result<List<KitchenOrderDto>>> GetKitchenBoardAsync();
    Task<Result<bool>> UpdateItemKitchenStatusAsync(long itemId, UpdateOrderItemStatusRequest dto);
    Task<Result<bool>> MarkAllItemsReadyAsync(long orderId);

    // Billing — converts order into POS Invoice
    Task<Result<DineOrderDto>> BillOrderAsync(long orderId, BillOrderRequest dto);

    // Kitchen extras
    Task<Result<KitchenStatsDto>> GetKitchenStatsAsync();
    Task<Result<List<CompletedKitchenOrderDto>>> GetCompletedOrdersAsync(int limit);
    Task<Result<bool>> RecallOrderAsync(long orderId);
}

// ============================================================
// Floor Section Service
// ============================================================

