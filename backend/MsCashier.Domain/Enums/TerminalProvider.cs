
namespace MsCashier.Domain.Enums;

// Payment Terminal (POS Machines — Saudi market)
public enum TerminalProvider : byte
{
    Geidea = 1, Nearpay = 2, Moyasar = 3, Foodics = 4,
    Ingenico = 5, Verifone = 6, StcPay = 7, HyperPay = 8,
    Manual = 99
}

