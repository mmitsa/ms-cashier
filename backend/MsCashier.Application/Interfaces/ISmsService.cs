namespace MsCashier.Application.Interfaces;

public interface ISmsService
{
    Task<bool> SendAsync(string phoneNumber, string message);
    Task<bool> SendOrderStatusAsync(string phoneNumber, string orderNumber, string status);
}
