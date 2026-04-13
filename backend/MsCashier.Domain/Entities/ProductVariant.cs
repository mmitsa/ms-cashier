using MsCashier.Domain.Common;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MsCashier.Domain.Entities;

/// <summary>Specific variant combination (e.g. "Red + Large") with own pricing and stock</summary>
public class ProductVariant : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int ProductId { get; set; }

    [MaxLength(50)]
    public string? Sku { get; set; }

    [MaxLength(50)]
    public string? Barcode { get; set; }

    /// <summary>JSON: {"الحجم":"كبير","اللون":"أحمر"}</summary>
    [Required, MaxLength(500)]
    public string VariantCombination { get; set; } = default!;

    /// <summary>Human-readable: "كبير / أحمر"</summary>
    [MaxLength(300)]
    public string? DisplayName { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CostPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RetailPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? HalfWholesalePrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? WholesalePrice { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public Product? Product { get; set; }
    public ICollection<Inventory> InventoryItems { get; set; } = new List<Inventory>();
}
