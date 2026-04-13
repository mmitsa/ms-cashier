namespace MsCashier.API.Middleware;

using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var tenantId = context.User.FindFirst("tenant_id")?.Value ?? "unknown";
            var userId = context.User.FindFirst("sub")?.Value ?? "anonymous";

            _logger.LogError(ex,
                "Unhandled exception on {Method} {Path}{QueryString} for tenant {TenantId} user {UserId}. TraceId: {TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.Request.QueryString,
                tenantId,
                userId,
                context.TraceIdentifier);

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        var (statusCode, message) = exception switch
        {
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "غير مصرح بالوصول."),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "العنصر المطلوب غير موجود."),
            InvalidOperationException => (StatusCodes.Status400BadRequest, "طلب غير صالح."),
            TimeoutException => (StatusCodes.Status504GatewayTimeout, "انتهت مهلة الطلب. يرجى المحاولة لاحقا."),
            DbUpdateException => (StatusCodes.Status409Conflict, "تعارض في البيانات. يرجى المحاولة مرة أخرى."),
            _ => (StatusCodes.Status500InternalServerError, "حدث خطأ داخلي. يرجى المحاولة لاحقا.")
        };

        context.Response.StatusCode = statusCode;

        // In development, include the actual exception message for debugging.
        // In production, always return the generic Arabic message.
        var errorMessage = _env.IsDevelopment() ? exception.Message : message;

        var response = new
        {
            success = false,
            errors = new[] { errorMessage },
            traceId = context.TraceIdentifier
        };

        var json = JsonSerializer.Serialize(response, JsonOptions);
        await context.Response.WriteAsync(json);
    }
}
