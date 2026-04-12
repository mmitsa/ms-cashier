using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class ProductionOrderItem
{
    [Key]
    public int Id { get; set; }

    public int ProductionOrderId { get; set; }
    public int? RecipeIngredientId { get; set; }
    public int ProductId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal RequiredQuantity { get; set; }

    public int? UnitId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal? ActualQuantityUsed { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitCost { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal TotalCost { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation
    public ProductionOrder? ProductionOrder { get; set; }
    public Product? Product { get; set; }
    public Unit? Unit { get; set; }
}

// ============================================================
// Production Waste Tracking
// ============================================================

