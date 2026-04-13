using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.Infrastructure.Services;

public class SmsService : ISmsService
{
    private readonly SmsSettings _settings;
    private readonly ILogger<SmsService> _logger;

    public SmsService(IOptions<SmsSettings> settings, ILogger<SmsService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<bool> SendAsync(string phoneNumber, string message)
    {
        try
        {
            var provider = (_settings.Provider ?? "stub").ToLowerInvariant();

            switch (provider)
            {
                case "twilio":
                    _logger.LogInformation("SMS [twilio] -> {Phone}: {Message}", phoneNumber, message);
                    // TODO: Implement Twilio API call when provider is configured
                    // POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
                    break;

                case "messagebird":
                    _logger.LogInformation("SMS [messagebird] -> {Phone}: {Message}", phoneNumber, message);
                    // TODO: Implement MessageBird API call when provider is configured
                    // POST https://rest.messagebird.com/messages
                    break;

                case "unifonic":
                    _logger.LogInformation("SMS [unifonic] -> {Phone}: {Message}", phoneNumber, message);
                    // TODO: Implement Unifonic API call when provider is configured
                    // POST https://el.cloud.unifonic.com/rest/SMS/messages
                    break;

                default:
                    _logger.LogInformation("SMS [stub] -> {Phone}: {Message}", phoneNumber, message);
                    break;
            }

            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {Phone}", phoneNumber);
            return false;
        }
    }

    public async Task<bool> SendOrderStatusAsync(string phoneNumber, string orderNumber, string status)
    {
        var message = $"MPOS: Order #{orderNumber} status updated to: {status}";
        return await SendAsync(phoneNumber, message);
    }
}
