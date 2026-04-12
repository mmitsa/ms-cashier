using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Recipe & Ingredients (Production / Kitchen)
// ============================================================

public class Recipe : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Code { get; set; } = default!;

    [Required, MaxLength(300)]
    public string Name { get; set; } = default!;

    [MaxLength(500)]
    public string? Description { get; set; }

    public RecipeType RecipeType { get; set; } = RecipeType.FinishedProduct;
    public RecipeStatus Status { get; set; } = RecipeStatus.Draft;

    public int? ProductId { get; set; }
    public int? CategoryId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal YieldQuantity { get; set; } = 1;

    public int? YieldUnitId { get; set; }

    public int PreparationTimeMinutes { get; set; }
    public int CookingTimeMinutes { get; set; }
    public int? ShelfLifeHours { get; set; }

    [MaxLength(1000)]
    public string? StorageInstructions { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Instructions { get; set; }

    public int Version { get; set; } = 1;
    public bool IsCurrentVersion { get; set; } = true;
    public int? ParentRecipeId { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? TargetFoodCostPercent { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CalculatedCost { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal CalculatedFoodCostPercent { get; set; }

    public DateTime? LastCostCalculationAt { get; set; }

    public int? BranchId { get; set; }
    public Guid? CreatedBy { get; set; }

    // Navigation
    public Product? Product { get; set; }
    public Category? Category { get; set; }
    public Unit? YieldUnit { get; set; }
    public Recipe? ParentRecipe { get; set; }
    public Branch? Branch { get; set; }
    public ICollection<RecipeIngredient> Ingredients { get; set; } = new List<RecipeIngredient>();
}

