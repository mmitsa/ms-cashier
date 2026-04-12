
namespace MsCashier.Domain.Enums;

// Customer Self-Order (QR)
public enum CustomerOrderStatus : byte
{
    Browsing = 1, Cart = 2, PendingPayment = 3,
    Paid = 4, Confirmed = 5, InKitchen = 6,
    Preparing = 7, Ready = 8, Served = 9,
    Completed = 10, Cancelled = 11
}

