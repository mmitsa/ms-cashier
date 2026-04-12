using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class Unit : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = default!;

    [MaxLength(20)]
    public string? Symbol { get; set; }

    public bool IsBase { get; set; } = true;
    public int? BaseUnitId { get; set; }

    [Column(TypeName = "decimal(18,6)")]
    public decimal? ConversionRate { get; set; }

    // Navigation
    public Unit? BaseUnit { get; set; }
}

// ============================================================
// Product
// ============================================================

