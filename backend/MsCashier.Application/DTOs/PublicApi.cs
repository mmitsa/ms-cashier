namespace MsCashier.Application.DTOs;

public record ApiKeyDto(
    int Id,
    string Name,
    string KeyPrefix,
    string? Scopes,
    int RateLimitPerMinute,
    bool IsActive,
    DateTime? ExpiresAt,
    DateTime? LastUsedAt,
    long RequestCount,
    DateTime CreatedAt);

public record CreateApiKeyRequest(
    string Name,
    List<string>? Scopes,
    DateTime? ExpiresAt);

public record ApiKeyCreatedResponse(
    int Id,
    string Name,
    string Key,
    string Prefix);

public record WebhookSubscriptionDto(
    int Id,
    string Url,
    string Secret,
    string Events,
    bool IsActive,
    int FailureCount,
    int MaxFailures,
    DateTime? LastDeliveredAt,
    DateTime CreatedAt);

public record CreateWebhookRequest(
    string Url,
    List<string> Events);

public record UpdateWebhookRequest(
    string? Url,
    List<string>? Events,
    bool? IsActive);

public record WebhookDeliveryDto(
    long Id,
    int SubscriptionId,
    string Event,
    string Payload,
    int StatusCode,
    string? Response,
    bool Success,
    int DurationMs,
    DateTime CreatedAt);

public record WebhookTestResult(
    bool Success,
    int StatusCode,
    int DurationMs,
    string? Response);
