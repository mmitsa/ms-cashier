using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Finance: Account & Transaction
// ============================================================

public class FinanceAccount : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    public AccountType AccountType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>الحساب المقابل في شجرة الحسابات (GL). يُنشأ تلقائياً.</summary>
    public int? ChartOfAccountId { get; set; }
    public ChartOfAccount? ChartOfAccount { get; set; }

    [MaxLength(100)] public string? BankName { get; set; }
    [MaxLength(50)] public string? AccountNumber { get; set; }
    [MaxLength(34)] public string? Iban { get; set; }
    public bool IsPrimary { get; set; }
}

