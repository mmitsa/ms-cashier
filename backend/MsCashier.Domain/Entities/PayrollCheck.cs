using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Payroll Check (salary payment records)
// ============================================================

public class PayrollCheck : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int PayrollId { get; set; }

    [Required, MaxLength(50)]
    public string CheckNumber { get; set; } = default!;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public DateTime IssueDate { get; set; }
    public DateTime? CashDate { get; set; }

    [MaxLength(200)]
    public string? BankName { get; set; }

    [MaxLength(100)]
    public string? AccountNumber { get; set; }

    public bool IsCashed { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public Guid IssuedBy { get; set; }

    // Navigation
    public Payroll? PayrollNav { get; set; }
}

// ============================================================
// Branch (multi-branch per tenant)
// ============================================================

