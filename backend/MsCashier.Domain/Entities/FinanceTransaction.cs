using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class FinanceTransaction
{
    [Key]
    public long Id { get; set; }

    public Guid TenantId { get; set; }
    public int AccountId { get; set; }

    public TransactionType TransactionType { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceBefore { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAfter { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? ReferenceType { get; set; }

    [MaxLength(100)]
    public string? ReferenceId { get; set; }

    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public FinanceAccount? Account { get; set; }
}

// ============================================================
// HR: Employee, Attendance, Payroll
// ============================================================

