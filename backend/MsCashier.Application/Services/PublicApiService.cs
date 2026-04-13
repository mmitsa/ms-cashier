using System.Diagnostics;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

public class PublicApiService : IPublicApiService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly IHttpClientFactory _httpClientFactory;

    public PublicApiService(IUnitOfWork uow, ICurrentTenantService tenant, IHttpClientFactory httpClientFactory)
    {
        _uow = uow;
        _tenant = tenant;
        _httpClientFactory = httpClientFactory;
    }

    // ════════════════════════════════════════════════════════
    // API Keys
    // ════════════════════════════════════════════════════════

    public async Task<Result<List<ApiKeyDto>>> GetKeysAsync()
    {
        try
        {
            var keys = await _uow.Repository<ApiKey>().Query()
                .Where(k => k.TenantId == _tenant.TenantId && !k.IsDeleted)
                .OrderByDescending(k => k.CreatedAt)
                .Select(k => new ApiKeyDto(
                    k.Id, k.Name, k.KeyPrefix, k.Scopes,
                    k.RateLimitPerMinute, k.IsActive, k.ExpiresAt,
                    k.LastUsedAt, k.RequestCount, k.CreatedAt))
                .ToListAsync();

            return Result<List<ApiKeyDto>>.Success(keys);
        }
        catch (Exception ex)
        {
            return Result<List<ApiKeyDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ApiKeyCreatedResponse>> CreateKeyAsync(string name, List<string>? scopes, DateTime? expiresAt)
    {
        try
        {
            // Generate a random 40-char key with "mpos_" prefix
            var rawKey = "mpos_" + GenerateRandomString(35);
            var keyHash = HashKey(rawKey);
            var keyPrefix = rawKey[..10];

            var apiKey = new ApiKey
            {
                TenantId = _tenant.TenantId,
                Name = name,
                KeyHash = keyHash,
                KeyPrefix = keyPrefix,
                Scopes = scopes != null ? JsonSerializer.Serialize(scopes) : null,
                ExpiresAt = expiresAt,
                IsActive = true,
                RateLimitPerMinute = 100,
                RequestCount = 0
            };

            await _uow.Repository<ApiKey>().AddAsync(apiKey);
            await _uow.SaveChangesAsync();

            return Result<ApiKeyCreatedResponse>.Success(
                new ApiKeyCreatedResponse(apiKey.Id, apiKey.Name, rawKey, keyPrefix),
                "تم إنشاء مفتاح API بنجاح. احفظ المفتاح الآن — لن يظهر مرة أخرى.");
        }
        catch (Exception ex)
        {
            return Result<ApiKeyCreatedResponse>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> RevokeKeyAsync(int id)
    {
        try
        {
            var key = await _uow.Repository<ApiKey>().Query()
                .FirstOrDefaultAsync(k => k.Id == id && k.TenantId == _tenant.TenantId);

            if (key is null)
                return Result<bool>.Failure("مفتاح API غير موجود");

            key.IsActive = false;
            key.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<ApiKey>().Update(key);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم إلغاء المفتاح بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<(Guid TenantId, List<string> Scopes)>> ValidateKeyAsync(string rawKey)
    {
        try
        {
            var keyHash = HashKey(rawKey);
            var key = await _uow.Repository<ApiKey>().Query()
                .FirstOrDefaultAsync(k => k.KeyHash == keyHash && !k.IsDeleted);

            if (key is null)
                return Result<(Guid, List<string>)>.Failure("مفتاح API غير صالح");

            if (!key.IsActive)
                return Result<(Guid, List<string>)>.Failure("مفتاح API معطّل");

            if (key.ExpiresAt.HasValue && key.ExpiresAt.Value < DateTime.UtcNow)
                return Result<(Guid, List<string>)>.Failure("مفتاح API منتهي الصلاحية");

            // Update usage stats
            key.LastUsedAt = DateTime.UtcNow;
            key.RequestCount++;
            _uow.Repository<ApiKey>().Update(key);
            await _uow.SaveChangesAsync();

            var scopes = !string.IsNullOrEmpty(key.Scopes)
                ? JsonSerializer.Deserialize<List<string>>(key.Scopes) ?? new List<string>()
                : new List<string>();

            return Result<(Guid, List<string>)>.Success((key.TenantId, scopes));
        }
        catch (Exception ex)
        {
            return Result<(Guid, List<string>)>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ════════════════════════════════════════════════════════
    // Webhooks
    // ════════════════════════════════════════════════════════

    public async Task<Result<List<WebhookSubscriptionDto>>> GetSubscriptionsAsync()
    {
        try
        {
            var subs = await _uow.Repository<WebhookSubscription>().Query()
                .Where(s => s.TenantId == _tenant.TenantId && !s.IsDeleted)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new WebhookSubscriptionDto(
                    s.Id, s.Url, s.Secret, s.Events, s.IsActive,
                    s.FailureCount, s.MaxFailures, s.LastDeliveredAt, s.CreatedAt))
                .ToListAsync();

            return Result<List<WebhookSubscriptionDto>>.Success(subs);
        }
        catch (Exception ex)
        {
            return Result<List<WebhookSubscriptionDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<WebhookSubscriptionDto>> CreateSubscriptionAsync(CreateWebhookRequest request)
    {
        try
        {
            var secret = GenerateRandomString(32);
            var sub = new WebhookSubscription
            {
                TenantId = _tenant.TenantId,
                Url = request.Url,
                Secret = secret,
                Events = JsonSerializer.Serialize(request.Events),
                IsActive = true,
                FailureCount = 0,
                MaxFailures = 10
            };

            await _uow.Repository<WebhookSubscription>().AddAsync(sub);
            await _uow.SaveChangesAsync();

            return Result<WebhookSubscriptionDto>.Success(
                new WebhookSubscriptionDto(
                    sub.Id, sub.Url, sub.Secret, sub.Events, sub.IsActive,
                    sub.FailureCount, sub.MaxFailures, sub.LastDeliveredAt, sub.CreatedAt),
                "تم إنشاء اشتراك Webhook بنجاح");
        }
        catch (Exception ex)
        {
            return Result<WebhookSubscriptionDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<WebhookSubscriptionDto>> UpdateSubscriptionAsync(int id, UpdateWebhookRequest request)
    {
        try
        {
            var sub = await _uow.Repository<WebhookSubscription>().Query()
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == _tenant.TenantId);

            if (sub is null)
                return Result<WebhookSubscriptionDto>.Failure("اشتراك Webhook غير موجود");

            if (request.Url != null) sub.Url = request.Url;
            if (request.Events != null) sub.Events = JsonSerializer.Serialize(request.Events);
            if (request.IsActive.HasValue) sub.IsActive = request.IsActive.Value;
            sub.UpdatedAt = DateTime.UtcNow;

            _uow.Repository<WebhookSubscription>().Update(sub);
            await _uow.SaveChangesAsync();

            return Result<WebhookSubscriptionDto>.Success(
                new WebhookSubscriptionDto(
                    sub.Id, sub.Url, sub.Secret, sub.Events, sub.IsActive,
                    sub.FailureCount, sub.MaxFailures, sub.LastDeliveredAt, sub.CreatedAt),
                "تم تحديث اشتراك Webhook بنجاح");
        }
        catch (Exception ex)
        {
            return Result<WebhookSubscriptionDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteSubscriptionAsync(int id)
    {
        try
        {
            var sub = await _uow.Repository<WebhookSubscription>().Query()
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == _tenant.TenantId);

            if (sub is null)
                return Result<bool>.Failure("اشتراك Webhook غير موجود");

            sub.IsDeleted = true;
            sub.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<WebhookSubscription>().Update(sub);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم حذف اشتراك Webhook بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<WebhookDeliveryDto>>> GetDeliveriesAsync(int subscriptionId, int page, int pageSize)
    {
        try
        {
            var query = _uow.Repository<WebhookDelivery>().Query()
                .Where(d => d.SubscriptionId == subscriptionId && d.TenantId == _tenant.TenantId);

            var totalCount = await query.CountAsync();

            var deliveries = await query
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(d => new WebhookDeliveryDto(
                    d.Id, d.SubscriptionId, d.Event, d.Payload,
                    d.StatusCode, d.Response, d.Success, d.DurationMs, d.CreatedAt))
                .ToListAsync();

            var result = new PagedResult<WebhookDeliveryDto>
            {
                Items = deliveries,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };

            return Result<PagedResult<WebhookDeliveryDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<WebhookDeliveryDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<WebhookTestResult>> TestWebhookAsync(int subscriptionId)
    {
        try
        {
            var sub = await _uow.Repository<WebhookSubscription>().Query()
                .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.TenantId == _tenant.TenantId);

            if (sub is null)
                return Result<WebhookTestResult>.Failure("اشتراك Webhook غير موجود");

            var testPayload = new
            {
                @event = "test.ping",
                timestamp = DateTime.UtcNow,
                data = new { message = "Test webhook delivery from MPOS" }
            };

            var deliveryResult = await DeliverWebhook(sub, "test.ping", testPayload);
            return Result<WebhookTestResult>.Success(deliveryResult);
        }
        catch (Exception ex)
        {
            return Result<WebhookTestResult>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task FireEventAsync(string eventName, object payload, Guid tenantId)
    {
        try
        {
            var subscriptions = await _uow.Repository<WebhookSubscription>().Query()
                .Where(s => s.TenantId == tenantId && s.IsActive && !s.IsDeleted)
                .ToListAsync();

            foreach (var sub in subscriptions)
            {
                var events = JsonSerializer.Deserialize<List<string>>(sub.Events) ?? new List<string>();
                if (!events.Contains(eventName)) continue;

                var eventPayload = new
                {
                    @event = eventName,
                    timestamp = DateTime.UtcNow,
                    data = payload
                };

                var result = await DeliverWebhook(sub, eventName, eventPayload);

                // Log the delivery
                var delivery = new WebhookDelivery
                {
                    TenantId = tenantId,
                    SubscriptionId = sub.Id,
                    Event = eventName,
                    Payload = JsonSerializer.Serialize(eventPayload),
                    StatusCode = result.StatusCode,
                    Response = result.Response,
                    Success = result.Success,
                    DurationMs = result.DurationMs
                };

                await _uow.Repository<WebhookDelivery>().AddAsync(delivery);

                // Update subscription stats
                if (result.Success)
                {
                    sub.FailureCount = 0;
                    sub.LastDeliveredAt = DateTime.UtcNow;
                }
                else
                {
                    sub.FailureCount++;
                    if (sub.FailureCount >= sub.MaxFailures)
                        sub.IsActive = false;
                }

                _uow.Repository<WebhookSubscription>().Update(sub);
            }

            await _uow.SaveChangesAsync();
        }
        catch
        {
            // Webhook delivery failures should not break the main flow
        }
    }

    // ════════════════════════════════════════════════════════
    // Private helpers
    // ════════════════════════════════════════════════════════

    private async Task<WebhookTestResult> DeliverWebhook(WebhookSubscription sub, string eventName, object payload)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // HMAC-SHA256 signature
            var signature = ComputeHmac(json, sub.Secret);
            content.Headers.Add("X-MPOS-Signature", signature);
            content.Headers.Add("X-MPOS-Event", eventName);

            var response = await client.PostAsync(sub.Url, content);
            sw.Stop();

            var responseBody = await response.Content.ReadAsStringAsync();
            var truncated = responseBody.Length > 2000 ? responseBody[..2000] : responseBody;

            return new WebhookTestResult(
                response.IsSuccessStatusCode,
                (int)response.StatusCode,
                (int)sw.ElapsedMilliseconds,
                truncated);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new WebhookTestResult(false, 0, (int)sw.ElapsedMilliseconds, ex.Message);
        }
    }

    private static string GenerateRandomString(int length)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        var bytes = RandomNumberGenerator.GetBytes(length);
        var result = new char[length];
        for (int i = 0; i < length; i++)
            result[i] = chars[bytes[i] % chars.Length];
        return new string(result);
    }

    private static string HashKey(string rawKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string ComputeHmac(string payload, string secret)
    {
        var key = Encoding.UTF8.GetBytes(secret);
        var data = Encoding.UTF8.GetBytes(payload);
        var hash = HMACSHA256.HashData(key, data);
        return "sha256=" + Convert.ToHexString(hash).ToLowerInvariant();
    }
}
