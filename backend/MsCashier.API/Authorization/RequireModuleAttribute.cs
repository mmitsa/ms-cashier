using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Interfaces;

namespace MsCashier.API.Authorization;

/// <summary>
/// يطبق على أي controller/action ويتأكد إن الوحدة المطلوبة مفعّلة للمتجر الحالي.
/// يتخطى الفحص لـ SuperAdmin.
/// مثال:
/// <code>
/// [RequireModule("Restaurant")]
/// public class DineOrderController : BaseApiController { ... }
/// </code>
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public sealed class RequireModuleAttribute : TypeFilterAttribute
{
    public RequireModuleAttribute(string moduleKey) : base(typeof(RequireModuleFilter))
    {
        Arguments = new object[] { moduleKey };
    }
}

internal sealed class RequireModuleFilter : IAsyncAuthorizationFilter
{
    private readonly string _moduleKey;
    private readonly ITenantModuleService _moduleService;
    private readonly ICurrentTenantService _currentTenant;

    public RequireModuleFilter(string moduleKey, ITenantModuleService moduleService, ICurrentTenantService currentTenant)
    {
        _moduleKey = moduleKey;
        _moduleService = moduleService;
        _currentTenant = currentTenant;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        if (string.Equals(_currentTenant.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            return;

        if (_currentTenant.TenantId == Guid.Empty)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var result = await _moduleService.IsEnabledAsync(_currentTenant.TenantId, _moduleKey);
        if (!result.IsSuccess || !result.Data)
        {
            context.Result = new ObjectResult(new
            {
                success = false,
                message = $"الوحدة «{_moduleKey}» غير مفعلة لهذا المتجر. راجع المدير لتفعيلها.",
                moduleKey = _moduleKey,
            })
            { StatusCode = 403 };
        }
    }
}
