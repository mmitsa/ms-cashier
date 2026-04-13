using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة المستأجرين (المتاجر)</summary>
[Route("api/v1/admin/tenants")]
[Authorize(Roles = "SuperAdmin")]
public class TenantsController : BaseApiController
{
    private readonly ITenantService _tenantService;
    private readonly IDemoDataSeeder _demoDataSeeder;

    public TenantsController(ITenantService tenantService, IDemoDataSeeder demoDataSeeder)
    {
        _tenantService = tenantService;
        _demoDataSeeder = demoDataSeeder;
    }

    /// <summary>إنشاء مستأجر جديد</summary>
    /// <param name="request">بيانات المستأجر</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTenantRequest request)
    {
        var result = await _tenantService.CreateTenantAsync(request);
        return HandleResult(result);
    }

    /// <summary>عرض جميع المستأجرين مع التصفح</summary>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _tenantService.GetAllTenantsAsync(page, pageSize);
        return HandleResult(result);
    }

    /// <summary>عرض بيانات مستأجر محدد</summary>
    /// <param name="id">معرف المستأجر</param>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _tenantService.GetTenantAsync(id);
        return HandleResult(result);
    }

    /// <summary>تحديث بيانات مستأجر</summary>
    /// <param name="id">معرف المستأجر</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTenantRequest request)
    {
        var result = await _tenantService.UpdateTenantAsync(id, request);
        return HandleResult(result);
    }

    /// <summary>تعليق حساب مستأجر</summary>
    /// <param name="id">معرف المستأجر</param>
    [HttpPost("{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id)
    {
        var result = await _tenantService.SuspendTenantAsync(id);
        return HandleResult(result);
    }

    /// <summary>تفعيل حساب مستأجر</summary>
    /// <param name="id">معرف المستأجر</param>
    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var result = await _tenantService.ActivateTenantAsync(id);
        return HandleResult(result);
    }

    /// <summary>تحميل بيانات تجريبية لمستأجر (للعروض والاختبار)</summary>
    /// <param name="id">معرف المستأجر</param>
    [HttpPost("{id:guid}/seed-demo")]
    public async Task<IActionResult> SeedDemo(Guid id)
    {
        var result = await _demoDataSeeder.SeedDemoDataAsync(id);
        return HandleResult(result);
    }
}

// ============================================================
// ProductsController
// ============================================================

