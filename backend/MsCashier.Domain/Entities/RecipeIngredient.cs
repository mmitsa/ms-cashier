using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class RecipeIngredient : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int RecipeId { get; set; }
    public IngredientType IngredientType { get; set; } = IngredientType.RawMaterial;

    public int? RawMaterialId { get; set; }
    public int? SubRecipeId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    public int? UnitId { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal WastePercent { get; set; }

    [NotMapped]
    public decimal GrossQuantity => WastePercent > 0 ? Quantity / (1 - WastePercent / 100) : Quantity;

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnitCost { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal TotalCost { get; set; }

    public int SortOrder { get; set; }
    public bool IsOptional { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation
    public Recipe? Recipe { get; set; }
    public Product? RawMaterial { get; set; }
    public Recipe? SubRecipe { get; set; }
    public Unit? Unit { get; set; }
}

// ============================================================
// Kitchen Station & Routing
// ============================================================

