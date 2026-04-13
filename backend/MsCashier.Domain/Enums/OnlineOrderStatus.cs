namespace MsCashier.Domain.Enums;

public enum OnlineOrderStatus : byte
{
    Pending = 1,
    Confirmed = 2,
    Preparing = 3,
    Shipped = 4,
    Delivered = 5,
    Cancelled = 6
}
