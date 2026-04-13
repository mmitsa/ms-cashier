using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

// ============================================================
// Store Shipping Config
// ============================================================

public class StoreShippingConfig : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int OnlineStoreId { get; set; }

    [Required, MaxLength(50)]
    public string ShippingType { get; set; } = "flat_rate"; // flat_rate, free, by_zone, pickup

    [Column(TypeName = "decimal(18,2)")]
    public decimal? FlatRate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? FreeShippingMinimum { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? ZoneRates { get; set; } // JSON

    public bool IsActive { get; set; } = true;

    // Navigation
    public OnlineStore? OnlineStore { get; set; }
}
