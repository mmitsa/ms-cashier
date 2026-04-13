using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Online Store DTOs
// ============================================================

public record OnlineStoreDto(
    int Id, string Subdomain, string? CustomDomain, bool IsActive, bool IsPublished,
    string ThemeId, string? ThemeSettings, string? LogoUrl, string? FaviconUrl,
    string? MetaTitle, string? MetaDescription,
    string? GoogleAnalyticsId, string? FacebookPixelId, string? CustomCss);

public record CreateOnlineStoreRequest(
    string Subdomain, string? CustomDomain, string? ThemeId,
    string? ThemeSettings, string? LogoUrl, string? FaviconUrl,
    string? MetaTitle, string? MetaDescription,
    string? GoogleAnalyticsId, string? FacebookPixelId, string? CustomCss);

public record UpdateOnlineStoreRequest(
    string? Subdomain, string? CustomDomain, bool? IsActive, bool? IsPublished,
    string? ThemeId, string? ThemeSettings, string? LogoUrl, string? FaviconUrl,
    string? MetaTitle, string? MetaDescription,
    string? GoogleAnalyticsId, string? FacebookPixelId, string? CustomCss);

// ============================================================
// Store Banner DTOs
// ============================================================

public record StoreBannerDto(
    int Id, int OnlineStoreId, string ImageUrl, string? MobileImageUrl,
    string? Title, string? TitleAr, string? Subtitle, string? LinkUrl,
    int SortOrder, bool IsActive, DateTime? StartsAt, DateTime? EndsAt);

// ============================================================
// Online Order DTOs
// ============================================================

public record OnlineOrderDto(
    long Id, int OnlineStoreId, string OrderNumber,
    int? ContactId, string? CustomerName, string? CustomerPhone, string? CustomerEmail,
    string? ShippingAddress, decimal Subtotal, decimal TaxAmount, decimal ShippingFee,
    decimal DiscountAmount, decimal TotalAmount,
    OnlineOrderStatus Status, OnlinePaymentStatus PaymentStatus,
    string? PaymentMethod, string? PaymentReference,
    long? InvoiceId, bool IsPrintedForPreparation, DateTime? PrintedAt,
    OnlineOrderType OrderType, string? DeliveryNotes, DateTime? EstimatedDeliveryAt,
    DateTime CreatedAt, List<OnlineOrderItemDto> Items);

public record OnlineOrderItemDto(
    long Id, int ProductId, int? ProductVariantId,
    string ProductName, string? VariantDescription,
    decimal Quantity, decimal UnitPrice, decimal TotalPrice, string? Notes);

public record CreateOnlineOrderRequest(
    string? CustomerName, string? CustomerPhone, string? CustomerEmail,
    string? ShippingAddress, OnlineOrderType OrderType,
    string? PaymentMethod, string? DeliveryNotes,
    List<CreateOnlineOrderItemRequest> Items);

public record CreateOnlineOrderItemRequest(
    int ProductId, int? ProductVariantId, decimal Quantity, string? Notes);

public record UpdateOrderStatusRequest(OnlineOrderStatus Status, string? Notes);

// ============================================================
// Payment & Shipping Config DTOs
// ============================================================

public record OnlinePaymentConfigDto(
    int Id, int OnlineStoreId, string Provider,
    string? ApiKey, string? SecretKey, string? WebhookSecret,
    string Currency, bool IsActive, bool IsTestMode, string? SupportedMethods);

public record StoreShippingConfigDto(
    int Id, int OnlineStoreId, string ShippingType,
    decimal? FlatRate, decimal? FreeShippingMinimum, string? ZoneRates, bool IsActive);

// ============================================================
// Storefront DTOs (public-facing)
// ============================================================

public record StorefrontProductDto(
    int Id, string Name, string? Description, string? ImageUrl,
    decimal Price, decimal? TaxRate, int? CategoryId, string? CategoryName,
    string? Barcode, string? SKU);

public record StorefrontCategoryDto(int Id, string Name, int ProductCount);

public record StoreDashboardDto(
    int TotalOrders, int PendingOrders, int ConfirmedOrders,
    int DeliveredOrders, int CancelledOrders,
    decimal TotalRevenue, decimal TodayRevenue, decimal TodayOrders);
