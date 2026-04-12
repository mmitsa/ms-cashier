using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Branch (multi-branch per tenant)
// ============================================================

public class Branch : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? ManagerName { get; set; }

    public BranchDataMode DataMode { get; set; } = BranchDataMode.SharedCatalog;
    public BranchStatus Status { get; set; } = BranchStatus.Active;

    public DateTime ActivatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal MonthlyFee { get; set; }

    public bool IsMainBranch { get; set; } = false;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation
    public ICollection<Warehouse> Warehouses { get; set; } = new List<Warehouse>();
}

// ============================================================
// Branch Activation Request
// ============================================================

