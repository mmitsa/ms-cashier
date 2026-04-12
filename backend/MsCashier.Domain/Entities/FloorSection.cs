using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Restaurant Tables
// ============================================================

// ============================================================
// Floor Sections (Zones / Areas)
// ============================================================

public class FloorSection : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = default!;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(20)]
    public string Color { get; set; } = "#6366f1"; // hex color for visual map

    [MaxLength(30)]
    public string Icon { get; set; } = "sofa"; // icon identifier

    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public bool IsOutdoor { get; set; } = false;
    public bool HasAC { get; set; } = true;
    public bool IsSmokingAllowed { get; set; } = false;
    public bool IsVIP { get; set; } = false;

    public int? BranchId { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? ServiceChargePercent { get; set; }

    public int? MaxCapacity { get; set; }

    // Operating hours (JSON stored)
    [Column(TypeName = "nvarchar(max)")]
    public string? OperatingHours { get; set; }

    // Navigation
    public Branch? Branch { get; set; }
    public ICollection<RestaurantTable> Tables { get; set; } = new List<RestaurantTable>();
}

// ============================================================
// Restaurant Tables
// ============================================================

