using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class Payroll
{
    [Key]
    public int Id { get; set; }

    public Guid TenantId { get; set; }
    public int EmployeeId { get; set; }

    public int Month { get; set; }
    public int Year { get; set; }

    public int WorkingDays { get; set; }
    public int PresentDays { get; set; }
    public int AbsentDays { get; set; }
    public int LateDays { get; set; }
    public int LeaveDays { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BasicSalary { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Allowances { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Deductions { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Bonus { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal OvertimeAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PenaltyAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NetSalary { get; set; }

    public PayrollStatus Status { get; set; } = PayrollStatus.Draft;

    public bool IsPaid { get; set; } = false;
    public DateTime? PaidDate { get; set; }

    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Employee? Employee { get; set; }
    public ICollection<PayrollItem> Items { get; set; } = new List<PayrollItem>();
    public ICollection<PayrollCheck> Checks { get; set; } = new List<PayrollCheck>();
}

// ============================================================
// Audit Log
// ============================================================

