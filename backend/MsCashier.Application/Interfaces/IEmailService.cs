namespace MsCashier.Application.Interfaces;

public interface IEmailService
{
    Task<bool> SendAsync(string to, string subject, string htmlBody);
    Task<bool> SendOrderConfirmationAsync(string to, string orderNumber, decimal total);
    Task<bool> SendLowStockAlertAsync(string to, string productName, decimal currentStock);
}
