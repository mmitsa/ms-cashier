using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Restaurant Tables
// ============================================================

public class RestaurantTable : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string TableNumber { get; set; } = default!;

    public int? SectionId { get; set; }

    [MaxLength(100)]
    public string? Section { get; set; } // legacy text field

    public int Capacity { get; set; } = 4;
    public TableStatus Status { get; set; } = TableStatus.Available;
    public bool IsActive { get; set; } = true;

    public int? BranchId { get; set; }

    // Grid position for the visual layout
    public int? GridRow { get; set; }
    public int? GridCol { get; set; }

    [MaxLength(20)]
    public string Shape { get; set; } = "square"; // square, circle, rectangle

    [Column(TypeName = "decimal(10,2)")]
    public decimal? MinOrderAmount { get; set; }

    // Navigation
    public FloorSection? FloorSection { get; set; }
    public Branch? Branch { get; set; }
    public ICollection<DineOrder> Orders { get; set; } = new List<DineOrder>();
}

// ============================================================
// Dine Order (Waiter / Take-Away / Delivery)
// ============================================================

