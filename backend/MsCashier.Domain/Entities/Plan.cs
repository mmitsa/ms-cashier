using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class Plan
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = default!;

    [Column(TypeName = "decimal(10,2)")]
    public decimal MonthlyPrice { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? YearlyPrice { get; set; }

    public int MaxUsers { get; set; }
    public int MaxWarehouses { get; set; }
    public int MaxPosStations { get; set; }
    public int? MaxProducts { get; set; }
    public int MaxBranches { get; set; } = 0;

    [Column(TypeName = "decimal(10,2)")]
    public decimal BranchMonthlyPrice { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? BranchYearlyPrice { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Features { get; set; }

    public bool IsActive { get; set; } = true;
}

// ============================================================
// User & Permissions
// ============================================================

