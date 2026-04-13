using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

/// <summary>
/// ربط المستأجر بمنصة خارجية — تجارة إلكترونية أو دفع آجل (BNPL) أو توصيل.
/// كل integration يخزّن credentials ككائن JSON مشفر.
///
/// Categories:
///   - Ecommerce: Salla, Shopify, EasyOrders, WooCommerce, Zid
///   - BNPL: Tabby, Tamara, ValU
///   - Delivery: Bosta, Aramex, SMSA
///   - Accounting: Daftra, Qoyod
/// </summary>
public class TenantIntegration : TenantEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>Category: Ecommerce, BNPL, Delivery, Accounting</summary>
    [Required, MaxLength(30)]
    public string Category { get; set; } = default!;

    /// <summary>Provider: Salla, Shopify, Tabby, Tamara, ValU, etc.</summary>
    [Required, MaxLength(50)]
    public string Provider { get; set; } = default!;

    /// <summary>Display name set by tenant</summary>
    [MaxLength(100)]
    public string? DisplayName { get; set; }

    public bool IsEnabled { get; set; }

    // ─── Credentials (stored as JSON) ────────────────────
    /// <summary>API Key / Client ID</summary>
    [MaxLength(500)]
    public string? ApiKey { get; set; }

    /// <summary>API Secret / Client Secret</summary>
    [MaxLength(500)]
    public string? ApiSecret { get; set; }

    /// <summary>Access Token (OAuth)</summary>
    [MaxLength(1000)]
    public string? AccessToken { get; set; }

    /// <summary>Merchant ID / Store ID</summary>
    [MaxLength(200)]
    public string? MerchantId { get; set; }

    /// <summary>Store URL (for Shopify, Salla, etc.)</summary>
    [MaxLength(500)]
    public string? StoreUrl { get; set; }

    /// <summary>Webhook URL for receiving events from the platform</summary>
    [MaxLength(500)]
    public string? WebhookUrl { get; set; }

    /// <summary>Webhook secret for verifying signatures</summary>
    [MaxLength(200)]
    public string? WebhookSecret { get; set; }

    /// <summary>Additional settings as JSON (provider-specific)</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? ExtraSettings { get; set; }

    // ─── Sync Status ─────────────────────────────────────
    public bool SyncProducts { get; set; }
    public bool SyncOrders { get; set; }
    public bool SyncInventory { get; set; }

    public DateTime? LastSyncAt { get; set; }

    [MaxLength(500)]
    public string? LastSyncStatus { get; set; }

    public int TotalSynced { get; set; }
    public int TotalErrors { get; set; }
}
