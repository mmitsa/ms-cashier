using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Payroll Item (breakdown of a payroll entry)
// ============================================================

public class PayrollItem
{
    [Key]
    public long Id { get; set; }

    public int PayrollId { get; set; }

    [Required, MaxLength(200)]
    public string ItemName { get; set; } = default!;

    public PayrollItemType ItemType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation
    public Payroll? Payroll { get; set; }
}

// ============================================================
// Payroll Check (salary payment records)
// ============================================================

