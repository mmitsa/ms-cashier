using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

/// <summary>
/// تسوية عمولة شهرية للمندوب.
/// تُحسب أول كل شهر على مبيعات الشهر السابق.
/// </summary>
public class SalesRepCommission : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int SalesRepId { get; set; }

    public int Month { get; set; }
    public int Year { get; set; }

    /// <summary>إجمالي المبيعات المسددة في الشهر</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPaidSales { get; set; }

    /// <summary>نسبة العمولة المطبقة</summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal CommissionPercent { get; set; }

    /// <summary>قيمة العمولة = TotalPaidSales × CommissionPercent / 100</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal CommissionAmount { get; set; }

    /// <summary>البونص الثابت</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal FixedBonus { get; set; }

    /// <summary>الإجمالي المستحق = CommissionAmount + FixedBonus</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalEarned { get; set; }

    /// <summary>المبلغ المصروف فعلياً</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidAmount { get; set; }

    public CommissionStatus Status { get; set; } = CommissionStatus.Pending;

    public DateTime? PaidAt { get; set; }

    // Navigation
    public SalesRep? SalesRep { get; set; }
}
