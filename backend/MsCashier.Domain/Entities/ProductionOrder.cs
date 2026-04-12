using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Production Order
// ============================================================

public class ProductionOrder : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Code { get; set; } = default!;

    public int RecipeId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal PlannedQuantity { get; set; }

    public int? PlannedUnitId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal? ActualQuantity { get; set; }

    public ProductionOrderStatus Status { get; set; } = ProductionOrderStatus.Draft;
    public ProductionPriority Priority { get; set; } = ProductionPriority.Normal;

    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }

    public Guid? AssignedToUserId { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public int? TargetWarehouseId { get; set; }
    public int? SourceWarehouseId { get; set; }

    [MaxLength(100)]
    public string? BatchNumber { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public int? BranchId { get; set; }
    public Guid? CreatedByUserId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal EstimatedCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? ActualCost { get; set; }

    // Navigation
    public Recipe? Recipe { get; set; }
    public Unit? PlannedUnit { get; set; }
    public Warehouse? TargetWarehouse { get; set; }
    public Warehouse? SourceWarehouse { get; set; }
    public Branch? Branch { get; set; }
    public ICollection<ProductionOrderItem> Items { get; set; } = new List<ProductionOrderItem>();
}

