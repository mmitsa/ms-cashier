using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

/// <summary>
/// مندوب مبيعات — مرتبط بمستخدم (User) للتسجيل الدخول،
/// ومخزن محدد يسحب منه البضاعة، ونسبة عمولة شهرية.
/// </summary>
public class SalesRep : TenantEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>حساب المستخدم اللي بيسجل بيه الدخول</summary>
    public Guid UserId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    [MaxLength(20)]
    public string? Phone { get; set; }

    /// <summary>المخزن المخصص للسحب منه (null = أي مخزن)</summary>
    public int? AssignedWarehouseId { get; set; }

    /// <summary>نسبة العمولة على المبيعات (مثلاً 5 = 5%)</summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal CommissionPercent { get; set; }

    /// <summary>بونص ثابت شهري (بالإضافة للنسبة)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal FixedBonus { get; set; }

    /// <summary>الرصيد المعلق (قيمة البضاعة المسحوبة غير المسددة)</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal OutstandingBalance { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public User? User { get; set; }
    public Warehouse? AssignedWarehouse { get; set; }
    public ICollection<SalesRepTransaction> Transactions { get; set; } = new List<SalesRepTransaction>();
    public ICollection<SalesRepCommission> Commissions { get; set; } = new List<SalesRepCommission>();
}
