namespace MsCashier.Domain.Enums.Accounting;

/// <summary>
/// مصدر القيد: يدوي أو مولّد تلقائياً من موديول معين.
/// </summary>
public enum JournalSource : byte
{
    Manual = 1,
    Sale = 2,
    SaleReturn = 3,
    Purchase = 4,
    PurchaseReturn = 5,
    Payment = 6,        // دفع لمورد
    Receipt = 7,        // قبض من عميل
    Payroll = 8,
    Inventory = 9,      // جرد / فروقات
    Production = 10,
    Installment = 11,
    Loyalty = 12,
    Adjustment = 13,    // تسوية يدوية
    OpeningBalance = 14,
    ClosingEntry = 15
}
