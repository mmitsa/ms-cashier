using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Customer Self-Order (QR) DTOs
// ============================================================

// -- QR Config Management --
public record QrConfigDto(
    int Id, string Code, int? TableId, string? TableNumber, int? BranchId,
    string DefaultType, bool IsActive, bool AllowRemoteOrder,
    bool RequirePhone, bool AllowCashPayment, bool AllowOnlinePayment,
    decimal? ServiceChargePercent, string? WelcomeMessage,
    string? LogoUrl, string ThemeColor, string QrUrl);

public record SaveQrConfigRequest(
    int? TableId, int? BranchId, string? DefaultType,
    bool IsActive, bool AllowRemoteOrder, bool RequirePhone,
    bool AllowCashPayment, bool AllowOnlinePayment,
    decimal? ServiceChargePercent, string? WelcomeMessage,
    string? LogoUrl, string? ThemeColor);

// -- Public Store Menu (no auth) --
public record PublicStoreInfoDto(
    Guid TenantId, string StoreName, string? LogoUrl, string ThemeColor,
    string? WelcomeMessage, string? Address, string? Phone,
    bool RequirePhone, bool AllowCashPayment, bool AllowOnlinePayment,
    decimal? ServiceChargePercent, string DefaultOrderType,
    int? TableId, string? TableNumber,
    List<PublicCategoryDto> Categories);

public record PublicCategoryDto(int Id, string Name, List<PublicProductDto> Products);

public record PublicProductDto(
    int Id, string Name, string? Description, decimal Price,
    string? ImageUrl, decimal? TaxRate, int? CategoryId, string? CategoryName);

// -- Customer Session --
public record StartSessionRequest(string? CustomerName, string? CustomerPhone, string? OrderType);
public record SessionDto(string SessionToken, string OrderType, string? CustomerName, int? TableId, DateTime ExpiresAt);

// -- Customer Order --
public record CustomerOrderDto(
    long Id, string OrderNumber, string Status, string OrderType,
    int? TableId, string? CustomerName, string? CustomerPhone,
    decimal SubTotal, decimal TaxAmount, decimal ServiceCharge, decimal TotalAmount,
    string? PaymentMethod, string? PaymentReference, DateTime? PaidAt,
    string? Notes, int? EstimatedMinutes,
    DateTime CreatedAt, DateTime? ConfirmedAt, DateTime? KitchenSentAt,
    DateTime? ReadyAt, DateTime? CompletedAt,
    List<CustomerOrderItemDto> Items);

public record CustomerOrderItemDto(
    long Id, int ProductId, string ProductName, string? ProductImage,
    decimal Quantity, decimal UnitPrice, decimal TotalPrice, string? SpecialNotes);

public record AddToCartRequest(int ProductId, decimal Quantity, string? SpecialNotes);
public record UpdateCartItemRequest(decimal Quantity, string? SpecialNotes);

public record SubmitOrderRequest(
    string? CustomerName, string? CustomerPhone,
    string? DeliveryAddress, string? Notes, string PaymentMethod);

public record CustomerOrderStatusDto(
    long OrderId, string OrderNumber, string Status,
    int? EstimatedMinutes, DateTime? KitchenSentAt, DateTime? ReadyAt,
    int ElapsedSeconds, string StatusLabel, string StatusColor);

