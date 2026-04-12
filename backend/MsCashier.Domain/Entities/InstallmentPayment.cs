using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class InstallmentPayment
{
    [Key]
    public int Id { get; set; }

    public int InstallmentId { get; set; }
    public int PaymentNumber { get; set; }
    public DateTime DueDate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidAmount { get; set; }

    public DateTime? PaidDate { get; set; }
    public InstallmentStatus Status { get; set; } = InstallmentStatus.Active;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

// ============================================================
// Finance: Account & Transaction
// ============================================================

