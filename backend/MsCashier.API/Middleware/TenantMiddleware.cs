namespace MsCashier.API.Middleware;

using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using MsCashier.Infrastructure.Data;
using MsCashier.Domain.Enums;
using System.Security.Claims;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ICurrentTenantService tenantService, AppDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantClaim = context.User.FindFirst("tenant_id")?.Value;
            var userClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? context.User.FindFirst("sub")?.Value;
            var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value ?? "Cashier";

            if (Guid.TryParse(tenantClaim, out var tenantId) && Guid.TryParse(userClaim, out var userId))
            {
                // Verify tenant still exists and is active
                var tenant = await dbContext.Tenants
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == tenantId);

                if (tenant is null)
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    await context.Response.WriteAsync("{\"success\":false,\"errors\":[\"المنشأة غير موجودة\"]}");
                    return;
                }

                if (tenant.Status == TenantStatus.Suspended && roleClaim != "SuperAdmin")
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    await context.Response.WriteAsync("{\"success\":false,\"errors\":[\"تم إيقاف المنشأة. تواصل مع الإدارة.\"]}");
                    return;
                }

                // Check if Trial has expired
                if (tenant.Status == TenantStatus.Trial && tenant.TrialEndDate.HasValue && tenant.TrialEndDate.Value < DateTime.UtcNow && roleClaim != "SuperAdmin")
                {
                    // Auto-expire the tenant using ExecuteUpdate to avoid tracking issues
                    await dbContext.Tenants
                        .Where(t => t.Id == tenantId && t.Status == TenantStatus.Trial)
                        .ExecuteUpdateAsync(s => s.SetProperty(t => t.Status, TenantStatus.Expired));

                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    await context.Response.WriteAsync("{\"success\":false,\"errors\":[\"انتهت الفترة التجريبية. يرجى التواصل مع الإدارة لتفعيل الاشتراك.\"]}");
                    return;
                }

                if (tenant.Status == TenantStatus.Expired && roleClaim != "SuperAdmin")
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json; charset=utf-8";
                    await context.Response.WriteAsync("{\"success\":false,\"errors\":[\"انتهت صلاحية الاشتراك. يرجى الدفع لإعادة التفعيل.\"]}");
                    return;
                }

                tenantService.SetTenant(tenantId, userId, roleClaim);
            }
            else
            {
                // Authenticated but invalid tenant claim — reject
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json; charset=utf-8";
                await context.Response.WriteAsync("{\"success\":false,\"errors\":[\"سياق المنشأة غير صالح\"]}");
                return;
            }
        }
        await _next(context);
    }
}
