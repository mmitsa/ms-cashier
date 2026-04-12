using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Customer Order Service (public, no auth)
// ============================================================

public interface ICustomerOrderService
{
    Task<Result<PublicStoreInfoDto>> GetStoreMenuAsync(string qrCode);
    Task<Result<SessionDto>> StartSessionAsync(string qrCode, StartSessionRequest request);

    Task<Result<CustomerOrderDto>> GetCartAsync(string sessionToken);
    Task<Result<CustomerOrderDto>> AddToCartAsync(string sessionToken, AddToCartRequest request);
    Task<Result<CustomerOrderDto>> UpdateCartItemAsync(string sessionToken, long itemId, UpdateCartItemRequest request);
    Task<Result<CustomerOrderDto>> RemoveFromCartAsync(string sessionToken, long itemId);

    Task<Result<CustomerOrderDto>> SubmitOrderAsync(string sessionToken, SubmitOrderRequest request);
    Task<Result<CustomerOrderStatusDto>> GetOrderStatusAsync(string sessionToken, long orderId);
    Task<Result<List<CustomerOrderDto>>> GetSessionOrdersAsync(string sessionToken);
}

// ============================================================
// Payment Terminal Service
// ============================================================

