using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Product
// ============================================================

public class Product : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(50)]
    public string? Barcode { get; set; }

    [MaxLength(50)]
    public string? SKU { get; set; }

    [Required, MaxLength(300)]
    public string Name { get; set; } = default!;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public int? CategoryId { get; set; }
    public int? UnitId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CostPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RetailPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? HalfWholesalePrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? WholesalePrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Price4 { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MinStock { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? MaxStock { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? TaxRate { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;
    public bool TrackInventory { get; set; } = true;
    public bool AllowNegativeStock { get; set; } = false;

    /// <summary>True if product has variants (sizes, colors, etc.)</summary>
    public bool HasVariants { get; set; } = false;

    // Bundle
    public bool IsBundle { get; set; } = false;

    public BundleDiscountType? BundleDiscountType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? BundleDiscountValue { get; set; }

    public bool BundleHasOwnStock { get; set; } = false;

    public DateTime? BundleValidFrom { get; set; }
    public DateTime? BundleValidTo { get; set; }

    public BundlePricingMode BundlePricingMode { get; set; } = BundlePricingMode.Unified;

    // Navigation
    public Category? Category { get; set; }
    public Unit? Unit { get; set; }
    public ICollection<Inventory> InventoryItems { get; set; } = new List<Inventory>();
    public ICollection<ProductVariantOption> VariantOptions { get; set; } = new List<ProductVariantOption>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<BundleItem> BundleItems { get; set; } = new List<BundleItem>();
}

// ============================================================
// Warehouse & Inventory
// ============================================================

