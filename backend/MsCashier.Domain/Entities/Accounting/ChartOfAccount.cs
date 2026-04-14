using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums.Accounting;

namespace MsCashier.Domain.Entities.Accounting;

/// <summary>
/// شجرة الحسابات الهرمية (Chart of Accounts).
/// كل تينانت له شجرته المستقلة؛ Code فريد داخل التينانت.
/// </summary>
public class ChartOfAccount : TenantEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>كود الحساب الهرمي (مثال: "1101"). فريد داخل التينانت.</summary>
    [Required, MaxLength(20)]
    public string Code { get; set; } = default!;

    [Required, MaxLength(200)]
    public string NameAr { get; set; } = default!;

    [MaxLength(200)]
    public string? NameEn { get; set; }

    public AccountCategory Category { get; set; }

    /// <summary>طبيعة الحساب (مدين/دائن) — مشتقة من Category لكن مخزنة للسرعة.</summary>
    public AccountNature Nature { get; set; }

    /// <summary>الحساب الأب في الشجرة (null للجذور).</summary>
    public int? ParentId { get; set; }
    public ChartOfAccount? Parent { get; set; }

    /// <summary>عمق الحساب في الشجرة (1 للجذور).</summary>
    public byte Level { get; set; } = 1;

    /// <summary>true = حساب تجميعي لا يقبل قيود مباشرة (فقط للهرمية).</summary>
    public bool IsGroup { get; set; }

    /// <summary>حساب نظام أساسي لا يمكن حذفه أو تعديل كوده.</summary>
    public bool IsSystem { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(10)]
    public string? Currency { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public ICollection<ChartOfAccount> Children { get; set; } = new List<ChartOfAccount>();
}
