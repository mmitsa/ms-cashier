using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Installment & InstallmentPayment
// ============================================================

public class Installment : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public long InvoiceId { get; set; }
    public int ContactId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DownPayment { get; set; }

    public int NumberOfPayments { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PaymentAmount { get; set; }

    public DateTime StartDate { get; set; }
    public InstallmentStatus Status { get; set; } = InstallmentStatus.Active;

    // Navigation
    public Invoice? Invoice { get; set; }
    public Contact? Contact { get; set; }
    public ICollection<InstallmentPayment> Payments { get; set; } = new List<InstallmentPayment>();
}

