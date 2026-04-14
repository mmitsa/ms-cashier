namespace MsCashier.Domain.Enums.Accounting;

/// <summary>
/// حالة قيد اليومية: مسودة (يمكن تعديلها)، مرحّل (نهائي)، مُعكَس (تم إلغاؤه بقيد عكسي).
/// </summary>
public enum JournalStatus : byte
{
    Draft = 1,
    Posted = 2,
    Reversed = 3
}
