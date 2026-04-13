using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MsCashier.Domain.Entities;
using MsCashier.Infrastructure.Data;

namespace MsCashier.Infrastructure.Services;

/// <summary>
/// Runs every 5 minutes. Retries failed webhook deliveries whose subscription
/// has not exceeded its MaxFailures threshold.
/// </summary>
public class WebhookRetryJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WebhookRetryJob> _logger;

    public WebhookRetryJob(IServiceProvider serviceProvider, ILogger<WebhookRetryJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WebhookRetryJob started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RetryFailedDeliveriesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WebhookRetryJob encountered an error.");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task RetryFailedDeliveriesAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var httpFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();

        var failedDeliveries = await db.WebhookDeliveries
            .IgnoreQueryFilters()
            .Include(d => d.Subscription)
            .Where(d => !d.Success
                && d.Subscription != null
                && d.Subscription.IsActive
                && d.Subscription.FailureCount < d.Subscription.MaxFailures)
            .OrderBy(d => d.CreatedAt)
            .Take(50) // batch limit
            .ToListAsync(ct);

        if (failedDeliveries.Count == 0)
        {
            _logger.LogDebug("WebhookRetryJob: No failed deliveries to retry.");
            return;
        }

        var client = httpFactory.CreateClient("WebhookRetry");
        client.Timeout = TimeSpan.FromSeconds(10);

        var retried = 0;

        foreach (var delivery in failedDeliveries)
        {
            if (ct.IsCancellationRequested) break;
            var subscription = delivery.Subscription!;

            try
            {
                var signature = ComputeHmacSignature(delivery.Payload, subscription.Secret);

                var request = new HttpRequestMessage(HttpMethod.Post, subscription.Url)
                {
                    Content = new StringContent(delivery.Payload, Encoding.UTF8, "application/json")
                };
                request.Headers.TryAddWithoutValidation("X-Webhook-Signature", signature);
                request.Headers.TryAddWithoutValidation("X-Webhook-Event", delivery.Event);

                var sw = Stopwatch.StartNew();
                var response = await client.SendAsync(request, ct);
                sw.Stop();

                delivery.StatusCode = (int)response.StatusCode;
                delivery.DurationMs = (int)sw.ElapsedMilliseconds;
                delivery.Response = await response.Content.ReadAsStringAsync(ct);

                if (response.IsSuccessStatusCode)
                {
                    delivery.Success = true;
                    subscription.FailureCount = 0;
                    subscription.LastDeliveredAt = DateTime.UtcNow;
                    _logger.LogInformation("WebhookRetryJob: Delivery {DeliveryId} succeeded on retry.", delivery.Id);
                }
                else
                {
                    subscription.FailureCount++;
                    _logger.LogWarning(
                        "WebhookRetryJob: Delivery {DeliveryId} failed again with status {StatusCode}. FailureCount={FailureCount}/{MaxFailures}.",
                        delivery.Id, delivery.StatusCode, subscription.FailureCount, subscription.MaxFailures);
                }

                // Truncate response to fit column
                if (delivery.Response?.Length > 2000)
                    delivery.Response = delivery.Response[..2000];

                retried++;
            }
            catch (Exception ex)
            {
                subscription.FailureCount++;
                delivery.Response = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message;
                _logger.LogWarning(ex, "WebhookRetryJob: Delivery {DeliveryId} retry threw an exception.", delivery.Id);
                retried++;
            }
        }

        if (retried > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("WebhookRetryJob: Retried {Count} deliveries.", retried);
        }
    }

    private static string ComputeHmacSignature(string payload, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        var hash = HMACSHA256.HashData(keyBytes, payloadBytes);
        return $"sha256={Convert.ToHexString(hash).ToLowerInvariant()}";
    }
}
