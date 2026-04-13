using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

// ============================================================
// Online Store
// ============================================================

public class OnlineStore : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Subdomain { get; set; } = default!; // store1.mpos.app

    [MaxLength(200)]
    public string? CustomDomain { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsPublished { get; set; } = false;

    [MaxLength(50)]
    public string ThemeId { get; set; } = "modern-retail";

    [Column(TypeName = "nvarchar(max)")]
    public string? ThemeSettings { get; set; } // JSON

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(500)]
    public string? FaviconUrl { get; set; }

    [MaxLength(200)]
    public string? MetaTitle { get; set; }

    [MaxLength(500)]
    public string? MetaDescription { get; set; }

    [MaxLength(50)]
    public string? GoogleAnalyticsId { get; set; }

    [MaxLength(50)]
    public string? FacebookPixelId { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? CustomCss { get; set; }

    // Navigation
    public ICollection<StoreBanner> Banners { get; set; } = new List<StoreBanner>();
    public ICollection<OnlineOrder> Orders { get; set; } = new List<OnlineOrder>();
    public ICollection<OnlinePaymentConfig> PaymentConfigs { get; set; } = new List<OnlinePaymentConfig>();
    public ICollection<StoreShippingConfig> ShippingConfigs { get; set; } = new List<StoreShippingConfig>();
}
