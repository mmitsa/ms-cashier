using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

// ============================================================
// Online Order Item
// ============================================================

public class OnlineOrderItem : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public long OnlineOrderId { get; set; }

    public int ProductId { get; set; }
    public int? ProductVariantId { get; set; }

    [Required, MaxLength(300)]
    public string ProductName { get; set; } = default!;

    [MaxLength(300)]
    public string? VariantDescription { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation
    public OnlineOrder? OnlineOrder { get; set; }
    public Product? Product { get; set; }
}
