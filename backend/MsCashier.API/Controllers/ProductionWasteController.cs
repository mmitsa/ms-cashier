using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة هدر الإنتاج</summary>
[Route("api/v1/production-waste")]
public class ProductionWasteController : BaseApiController
{
    private readonly IProductionWasteService _wasteService;
    public ProductionWasteController(IProductionWasteService wasteService) => _wasteService = wasteService;

    /// <summary>تسجيل هدر جديد</summary>
    /// <param name="request">بيانات الهدر</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWasteRequest request)
        => HandleResult(await _wasteService.CreateAsync(request));

    /// <summary>البحث في سجلات الهدر</summary>
    /// <param name="request">معايير التصفية</param>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] WasteFilterRequest request)
        => HandleResult(await _wasteService.SearchAsync(request));

    /// <summary>عرض ملخص الهدر لفترة محددة</summary>
    /// <param name="from">تاريخ البداية</param>
    /// <param name="to">تاريخ النهاية</param>
    /// <param name="branchId">معرف الفرع (اختياري)</param>
    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int? branchId)
        => HandleResult(await _wasteService.GetSummaryAsync(from, to, branchId));

    /// <summary>حذف سجل هدر</summary>
    /// <param name="id">معرف السجل</param>
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
        => HandleResult(await _wasteService.DeleteAsync(id));
}
