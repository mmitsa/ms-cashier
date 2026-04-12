
namespace MsCashier.Domain.Enums;

public enum TerminalTxnStatus : byte { Initiated = 1, Pending = 2, Approved = 3, Declined = 4, Cancelled = 5, TimedOut = 6, Error = 7, Reversed = 8 }

