using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

// ============================================================
// LoyaltyProgram — برنامج نقاط الولاء
// ============================================================

public class LoyaltyProgram : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    /// <summary>عدد النقاط لكل وحدة عملة مصروفة</summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal PointsPerCurrency { get; set; }

    /// <summary>قيمة النقطة الواحدة بالعملة عند الاستبدال</summary>
    [Column(TypeName = "decimal(18,4)")]
    public decimal RedemptionValue { get; set; }

    /// <summary>أقل عدد نقاط يمكن استبدالها</summary>
    public int MinRedemptionPoints { get; set; }

    /// <summary>عدد أيام انتهاء صلاحية النقاط (0 = لا تنتهي)</summary>
    public int PointsExpireDays { get; set; }

    public bool IsActive { get; set; } = true;
}
