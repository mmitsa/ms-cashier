namespace MsCashier.Application.DTOs;

public record TenantIntegrationDto(
    int Id,
    string Category,
    string Provider,
    string? DisplayName,
    bool IsEnabled,
    string? MerchantId,
    string? StoreUrl,
    string? WebhookUrl,
    bool SyncProducts,
    bool SyncOrders,
    bool SyncInventory,
    DateTime? LastSyncAt,
    string? LastSyncStatus,
    int TotalSynced,
    int TotalErrors,
    bool HasApiKey,
    bool HasAccessToken);

public record SaveIntegrationRequest(
    string Category,
    string Provider,
    string? DisplayName,
    bool IsEnabled,
    string? ApiKey,
    string? ApiSecret,
    string? AccessToken,
    string? MerchantId,
    string? StoreUrl,
    string? WebhookSecret,
    string? ExtraSettings,
    bool SyncProducts = false,
    bool SyncOrders = false,
    bool SyncInventory = false);

/// <summary>Available providers catalog</summary>
public record IntegrationProviderInfo(
    string Category,
    string Provider,
    string DisplayName,
    string? LogoUrl,
    string Description,
    string[] RequiredFields);

public static class IntegrationCatalog
{
    public static readonly List<IntegrationProviderInfo> Providers = new()
    {
        // ─── E-commerce ────────────────────────────
        new("Ecommerce", "Salla", "سلّة", null,
            "منصة سلّة للتجارة الإلكترونية — مزامنة المنتجات والطلبات والمخزون",
            new[] { "ApiKey", "ApiSecret", "StoreUrl" }),

        new("Ecommerce", "Shopify", "شوبيفاي", null,
            "Shopify — مزامنة المنتجات والطلبات والمخزون مع متجرك على شوبيفاي",
            new[] { "AccessToken", "StoreUrl" }),

        new("Ecommerce", "EasyOrders", "إيزي أوردرز", null,
            "EasyOrders — منصة طلبات مصرية للمطاعم والمتاجر",
            new[] { "ApiKey", "MerchantId" }),

        new("Ecommerce", "Zid", "زد", null,
            "منصة زد للتجارة الإلكترونية — مزامنة كاملة للمتجر",
            new[] { "ApiKey", "ApiSecret", "MerchantId" }),

        new("Ecommerce", "WooCommerce", "ووكومرس", null,
            "WooCommerce — ربط مع متجر WordPress + WooCommerce",
            new[] { "ApiKey", "ApiSecret", "StoreUrl" }),

        // ─── BNPL (Buy Now Pay Later) ──────────────
        new("BNPL", "Tabby", "تابي", null,
            "تابي — اشترِ الآن وادفع لاحقاً (4 أقساط بدون فوائد). السعودية والإمارات",
            new[] { "ApiKey", "ApiSecret", "MerchantId" }),

        new("BNPL", "Tamara", "تمارا", null,
            "تمارا — قسّمها على 3 أو ادفع بعد 30 يوم. السعودية ومصر والإمارات",
            new[] { "ApiKey", "MerchantId" }),

        new("BNPL", "ValU", "ڤاليو", null,
            "ڤاليو — تقسيط حتى 60 شهر بدون مقدم. مصر فقط",
            new[] { "ApiKey", "ApiSecret", "MerchantId" }),

        // ─── Delivery ──────────────────────────────
        new("Delivery", "Bosta", "بوسطة", null,
            "بوسطة — شحن وتوصيل داخل مصر",
            new[] { "ApiKey", "MerchantId" }),

        new("Delivery", "Aramex", "أرامكس", null,
            "أرامكس — شحن محلي ودولي",
            new[] { "ApiKey", "ApiSecret", "MerchantId" }),

        // ─── Accounting ────────────────────────────
        new("Accounting", "Daftra", "دفترة", null,
            "دفترة — ربط الفواتير والمحاسبة",
            new[] { "ApiKey" }),

        new("Accounting", "Qoyod", "قيود", null,
            "قيود — نظام محاسبة سحابي سعودي",
            new[] { "ApiKey", "ApiSecret" }),
    };
}
