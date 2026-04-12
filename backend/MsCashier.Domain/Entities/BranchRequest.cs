using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Branch Activation Request
// ============================================================

public class BranchRequest : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string BranchName { get; set; } = default!;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? ManagerName { get; set; }

    public BranchDataMode DataMode { get; set; } = BranchDataMode.SharedCatalog;
    public BranchRequestStatus Status { get; set; } = BranchRequestStatus.Pending;

    [Column(TypeName = "decimal(10,2)")]
    public decimal RequestedFee { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    [MaxLength(500)]
    public string? AdminNotes { get; set; }

    public int? ActivatedBranchId { get; set; }

    [MaxLength(200)]
    public string? PaymentReference { get; set; }

    public DateTime? PaidAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedBy { get; set; }

    // Navigation
    public Branch? ActivatedBranch { get; set; }
}

// ============================================================
// Restaurant Tables
// ============================================================

// ============================================================
// Floor Sections (Zones / Areas)
// ============================================================

