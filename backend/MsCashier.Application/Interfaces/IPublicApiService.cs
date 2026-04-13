using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IPublicApiService
{
    // API Keys
    Task<Result<List<ApiKeyDto>>> GetKeysAsync();
    Task<Result<ApiKeyCreatedResponse>> CreateKeyAsync(string name, List<string>? scopes, DateTime? expiresAt);
    Task<Result<bool>> RevokeKeyAsync(int id);
    Task<Result<(Guid TenantId, List<string> Scopes)>> ValidateKeyAsync(string rawKey);

    // Webhooks
    Task<Result<List<WebhookSubscriptionDto>>> GetSubscriptionsAsync();
    Task<Result<WebhookSubscriptionDto>> CreateSubscriptionAsync(CreateWebhookRequest request);
    Task<Result<WebhookSubscriptionDto>> UpdateSubscriptionAsync(int id, UpdateWebhookRequest request);
    Task<Result<bool>> DeleteSubscriptionAsync(int id);
    Task<Result<PagedResult<WebhookDeliveryDto>>> GetDeliveriesAsync(int subscriptionId, int page, int pageSize);
    Task<Result<WebhookTestResult>> TestWebhookAsync(int subscriptionId);

    // Fire events (called internally by other services)
    Task FireEventAsync(string eventName, object payload, Guid tenantId);
}
