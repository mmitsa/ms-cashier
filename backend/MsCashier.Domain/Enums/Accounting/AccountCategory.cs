namespace MsCashier.Domain.Enums.Accounting;

/// <summary>
/// المجموعة الرئيسية للحساب حسب المعايير المحاسبية.
/// Asset=أصول, Liability=خصوم, Equity=حقوق ملكية, Revenue=إيرادات, Expense=مصروفات.
/// </summary>
public enum AccountCategory : byte
{
    Asset = 1,
    Liability = 2,
    Equity = 3,
    Revenue = 4,
    Expense = 5
}
