namespace MsCashier.Domain.Enums;

public enum SalesRepTxnType : byte
{
    ItemTaken = 1,
    PaymentCollected = 2,
    CommissionPaid = 3,
    Adjustment = 4,
}
