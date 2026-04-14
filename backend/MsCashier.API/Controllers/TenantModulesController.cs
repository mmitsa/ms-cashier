using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>تفعيل/تعطيل الوحدات الوظيفية لكل متجر (SuperAdmin)</summary>
[Route("api/v1/admin/tenants/{tenantId:guid}/modules")]
[Authorize(Roles = "SuperAdmin")]
public class AdminTenantModulesController : BaseApiController
{
    private readonly ITenantModuleService _service;

    public AdminTenantModulesController(ITenantModuleService service) => _service = service;

    /// <summary>قراءة الوحدات وحالتها للمتجر</summary>
    [HttpGet]
    public async Task<IActionResult> Get(Guid tenantId)
        => HandleResult(await _service.GetModulesAsync(tenantId));

    /// <summary>تحديث تفعيل/تعطيل الوحدات للمتجر</summary>
    [HttpPut]
    public async Task<IActionResult> Update(Guid tenantId, [FromBody] UpdateTenantModulesRequest request)
    {
        Guid? updatedBy = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : null;
        return HandleResult(await _service.UpdateModulesAsync(tenantId, request, updatedBy));
    }
}

/// <summary>قراءة الوحدات المفعلة للمتجر الحالي (لأي مستخدم مسجل)</summary>
[Route("api/v1/tenant/modules")]
[Authorize]
public class TenantModulesController : BaseApiController
{
    private readonly ITenantModuleService _service;

    public TenantModulesController(ITenantModuleService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetMy()
        => HandleResult(await _service.GetCurrentTenantModulesAsync());
}
