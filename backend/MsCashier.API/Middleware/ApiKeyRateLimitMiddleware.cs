using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MsCashier.Domain.Entities;
using MsCashier.Infrastructure.Data;

namespace MsCashier.API.Middleware;

public class ApiKeyRateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyRateLimitMiddleware> _logger;

    private static readonly ConcurrentDictionary<string, SlidingWindowCounter> Counters = new();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ApiKeyRateLimitMiddleware(RequestDelegate next, ILogger<ApiKeyRateLimitMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api/v1/public"))
        {
            await _next(context);
            return;
        }

        var apiKeyHeader = context.Request.Headers["X-API-Key"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(apiKeyHeader))
        {
            await _next(context);
            return;
        }

        var keyHash = HashKey(apiKeyHeader);

        var db = context.RequestServices.GetRequiredService<AppDbContext>();
        var apiKey = await db.Set<ApiKey>().AsNoTracking()
            .FirstOrDefaultAsync(k => k.KeyHash == keyHash && k.IsActive && !k.IsDeleted);

        if (apiKey is null)
        {
            await _next(context);
            return;
        }

        var rateLimit = apiKey.RateLimitPerMinute;
        if (rateLimit <= 0)
        {
            await _next(context);
            return;
        }

        var counter = Counters.GetOrAdd(keyHash, _ => new SlidingWindowCounter());

        if (!counter.TryIncrement(rateLimit))
        {
            _logger.LogWarning(
                "API key rate limit exceeded for key prefix {KeyPrefix} (limit: {Limit}/min)",
                apiKey.KeyPrefix, rateLimit);

            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.ContentType = "application/json; charset=utf-8";

            var remaining = counter.GetRemainingSeconds();
            context.Response.Headers.Append("Retry-After", remaining.ToString());

            var response = new
            {
                success = false,
                errors = new[] { "Rate limit exceeded. Try again later." }
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
            return;
        }

        await _next(context);
    }

    private static string HashKey(string rawKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private sealed class SlidingWindowCounter
    {
        private readonly ConcurrentQueue<DateTime> _timestamps = new();
        private readonly object _lock = new();

        public bool TryIncrement(int maxPerMinute)
        {
            var now = DateTime.UtcNow;
            var windowStart = now.AddMinutes(-1);

            // Evict expired entries
            while (_timestamps.TryPeek(out var oldest) && oldest < windowStart)
                _timestamps.TryDequeue(out _);

            lock (_lock)
            {
                if (_timestamps.Count >= maxPerMinute)
                    return false;

                _timestamps.Enqueue(now);
                return true;
            }
        }

        public int GetRemainingSeconds()
        {
            if (_timestamps.TryPeek(out var oldest))
            {
                var remaining = oldest.AddMinutes(1) - DateTime.UtcNow;
                return Math.Max(1, (int)Math.Ceiling(remaining.TotalSeconds));
            }
            return 60;
        }
    }
}
