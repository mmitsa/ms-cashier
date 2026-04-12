using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Production Waste Tracking
// ============================================================

public class ProductionWaste : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int? ProductionOrderId { get; set; }
    public WasteType WasteType { get; set; }

    public int ProductId { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    public int? UnitId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal EstimatedCost { get; set; }

    [MaxLength(1000)]
    public string? Reason { get; set; }

    public Guid ReportedByUserId { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;

    public int? BranchId { get; set; }

    // Navigation
    public ProductionOrder? ProductionOrder { get; set; }
    public Product? Product { get; set; }
    public Unit? Unit { get; set; }
    public Branch? Branch { get; set; }
}

