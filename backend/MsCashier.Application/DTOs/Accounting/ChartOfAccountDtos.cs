namespace MsCashier.Application.DTOs.Accounting;

/// <summary>عنصر شجرة الحسابات (مسطّح) كما يُعاد للواجهة.</summary>
public record ChartOfAccountDto(
    int Id,
    string Code,
    string NameAr,
    string? NameEn,
    byte Category,
    byte Nature,
    int? ParentId,
    byte Level,
    bool IsGroup,
    bool IsSystem,
    bool IsActive,
    string? Description);

/// <summary>طلب إنشاء حساب فرعي جديد تحت حساب تجميعي.</summary>
public record CreateChartOfAccountRequest(
    int ParentId,
    string Code,
    string NameAr,
    string? NameEn,
    string? Description);

/// <summary>طلب تعديل حقول حساب (الاسم/الوصف/التفعيل). الكود والفئة والطبيعة ثابتة.</summary>
public record UpdateChartOfAccountRequest(
    string NameAr,
    string? NameEn,
    string? Description,
    bool IsActive);
