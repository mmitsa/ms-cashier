using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Employee Salary Config (allowances, deductions per employee)
// ============================================================

public class SalaryConfig : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    [Required, MaxLength(200)]
    public string ItemName { get; set; } = default!;

    public PayrollItemType ItemType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public bool IsPercentage { get; set; }
    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation
    public Employee? Employee { get; set; }
}

// ============================================================
// Payroll Item (breakdown of a payroll entry)
// ============================================================

