namespace MsCashier.API.Middleware;

using System.Diagnostics;

/// <summary>
/// Logs HTTP request metadata with structured data: method, path, status code,
/// response time, and tenant ID. Slow requests (>500ms) are logged at Warning level.
/// Health check endpoints are skipped to reduce noise.
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    private static readonly HashSet<string> SkippedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/health",
        "/healthz",
        "/ready"
    };

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (SkippedPaths.Contains(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var elapsedMs = stopwatch.ElapsedMilliseconds;
            var tenantId = context.User.FindFirst("tenant_id")?.Value ?? "unknown";
            var method = context.Request.Method;
            var path = context.Request.Path;
            var statusCode = context.Response.StatusCode;

            if (elapsedMs > 500)
            {
                _logger.LogWarning(
                    "Slow request: {Method} {Path} responded {StatusCode} in {ElapsedMs}ms [Tenant: {TenantId}]",
                    method, path, statusCode, elapsedMs, tenantId);
            }
            else
            {
                _logger.LogInformation(
                    "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms [Tenant: {TenantId}]",
                    method, path, statusCode, elapsedMs, tenantId);
            }
        }
    }
}
