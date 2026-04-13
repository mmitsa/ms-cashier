using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>إدارة التكاملات مع الأنظمة الخارجية</summary>
[Route("api/v1/integrations")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class IntegrationsController : BaseApiController
{
    private readonly IIntegrationService _service;
    public IntegrationsController(IIntegrationService service) => _service = service;

    /// <summary>عرض قائمة مزودي التكامل المتاحين</summary>
    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog()
        => HandleResult(await _service.GetCatalogAsync());

    /// <summary>عرض جميع التكاملات المفعلة للمستأجر</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    /// <summary>عرض تكامل بالمعرف</summary>
    /// <param name="id">معرف التكامل</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    /// <summary>إنشاء تكامل جديد</summary>
    /// <param name="request">بيانات التكامل</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveIntegrationRequest request)
        => HandleResult(await _service.SaveAsync(null, request));

    /// <summary>تحديث تكامل</summary>
    /// <param name="id">معرف التكامل</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveIntegrationRequest request)
        => HandleResult(await _service.SaveAsync(id, request));

    /// <summary>حذف تكامل</summary>
    /// <param name="id">معرف التكامل</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    /// <summary>تفعيل/تعطيل تكامل</summary>
    /// <param name="id">معرف التكامل</param>
    [HttpPost("{id:int}/toggle")]
    public async Task<IActionResult> Toggle(int id)
        => HandleResult(await _service.ToggleAsync(id));

    /// <summary>اختبار اتصال التكامل</summary>
    /// <param name="id">معرف التكامل</param>
    [HttpPost("{id:int}/test")]
    public async Task<IActionResult> TestConnection(int id)
        => HandleResult(await _service.TestConnectionAsync(id));
}
