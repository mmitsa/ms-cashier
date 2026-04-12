using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Warehouse & Inventory
// ============================================================

public class Warehouse : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    [MaxLength(500)]
    public string? Location { get; set; }

    public bool IsMain { get; set; } = false;
    public bool IsActive { get; set; } = true;

    public int? BranchId { get; set; }

    // Navigation
    public Branch? Branch { get; set; }
}

