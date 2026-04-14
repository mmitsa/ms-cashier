namespace MsCashier.Domain.Enums.Accounting;

/// <summary>
/// طبيعة الحساب: Debit (مدين) للأصول والمصروفات، Credit (دائن) للخصوم وحقوق الملكية والإيرادات.
/// </summary>
public enum AccountNature : byte
{
    Debit = 1,
    Credit = 2
}
