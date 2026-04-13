using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<bool> SendAsync(string to, string subject, string htmlBody)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_settings.Username) || string.IsNullOrWhiteSpace(_settings.Password))
            {
                _logger.LogWarning("Email not configured (missing Username/Password). Skipping send to {To}.", to);
                return false;
            }

            using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
            {
                Credentials = new NetworkCredential(_settings.Username, _settings.Password),
                EnableSsl = _settings.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = 30_000
            };

            var from = new MailAddress(_settings.FromAddress, _settings.FromName);
            using var message = new MailMessage(from, new MailAddress(to))
            {
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
                SubjectEncoding = System.Text.Encoding.UTF8,
                BodyEncoding = System.Text.Encoding.UTF8
            };

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent successfully to {To} — subject: {Subject}", to, subject);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To} — subject: {Subject}", to, subject);
            return false;
        }
    }

    public async Task<bool> SendOrderConfirmationAsync(string to, string orderNumber, decimal total)
    {
        var subject = $"MPOS — Order Confirmation #{orderNumber}";
        var html = WrapInTemplate($@"
            <h2 style=""color: #4F46E5; margin: 0 0 16px;"">Order Confirmed</h2>
            <p style=""font-size: 16px; color: #374151; margin: 0 0 8px;"">
                Your order <strong>#{orderNumber}</strong> has been confirmed.
            </p>
            <div style=""background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;"">
                <p style=""margin: 0; font-size: 14px; color: #6B7280;"">Total</p>
                <p style=""margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #4F46E5;"">{total:N2}</p>
            </div>
            <p style=""font-size: 14px; color: #6B7280; margin: 0;"">Thank you for your purchase!</p>
            <p style=""font-size: 14px; color: #6B7280; margin: 4px 0 0; direction: rtl;"">شكراً لتسوقكم معنا!</p>
        ");

        return await SendAsync(to, subject, html);
    }

    public async Task<bool> SendLowStockAlertAsync(string to, string productName, decimal currentStock)
    {
        var subject = $"MPOS — Low Stock Alert: {productName}";
        var html = WrapInTemplate($@"
            <h2 style=""color: #DC2626; margin: 0 0 16px;"">Low Stock Alert</h2>
            <p style=""font-size: 16px; color: #374151; margin: 0 0 8px;"">
                Product <strong>{System.Net.WebUtility.HtmlEncode(productName)}</strong> is running low.
            </p>
            <div style=""background: #FEF2F2; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;"">
                <p style=""margin: 0; font-size: 14px; color: #6B7280;"">Current Stock</p>
                <p style=""margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #DC2626;"">{currentStock:N2}</p>
            </div>
            <p style=""font-size: 14px; color: #6B7280; margin: 0;"">Please restock this item soon.</p>
            <p style=""font-size: 14px; color: #6B7280; margin: 4px 0 0; direction: rtl;"">يرجى إعادة تعبئة هذا المنتج قريباً.</p>
        ");

        return await SendAsync(to, subject, html);
    }

    private static string WrapInTemplate(string bodyContent)
    {
        return $@"<!DOCTYPE html>
<html lang=""en"" dir=""ltr"">
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1""></head>
<body style=""margin: 0; padding: 0; background: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;"">
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background: #F9FAFB; padding: 32px 0;"">
<tr><td align=""center"">
<table role=""presentation"" width=""560"" cellpadding=""0"" cellspacing=""0"" style=""background: #FFFFFF; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;"">
  <!-- Header -->
  <tr>
    <td style=""background: linear-gradient(135deg, #4F46E5, #6366F1); padding: 24px; text-align: center;"">
      <h1 style=""margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;"">MPOS</h1>
      <p style=""margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 12px;"">Point of Sale System</p>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style=""padding: 32px 24px;"">
      {bodyContent}
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style=""padding: 16px 24px; border-top: 1px solid #E5E7EB; text-align: center;"">
      <p style=""margin: 0; font-size: 12px; color: #9CA3AF;"">MPOS &mdash; The Most Complete POS System</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>";
    }
}
