using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

/// <summary>
/// حركة في دفتر حساب المندوب:
///   - ItemTaken: بضاعة مسحوبة (تزيد الرصيد المعلق)
///   - PaymentCollected: سداد محصّل من العميل (تنقص الرصيد)
///   - CommissionPaid: عمولة مصروفة للمندوب
///   - Adjustment: تعديل يدوي من الإدارة
/// </summary>
public class SalesRepTransaction : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int SalesRepId { get; set; }

    public SalesRepTxnType TransactionType { get; set; }

    /// <summary>موجب = مدين (بضاعة)، سالب = دائن (سداد)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    /// <summary>الرصيد بعد هذه الحركة</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAfter { get; set; }

    /// <summary>مرجع الفاتورة (إن وجد)</summary>
    public long? InvoiceId { get; set; }

    /// <summary>طريقة السداد (للمدفوعات فقط)</summary>
    public PaymentMethod? PaymentMethod { get; set; }

    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation
    public SalesRep? SalesRep { get; set; }
    public Invoice? Invoice { get; set; }
}
