using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>إدارة ورديات الكاشير (افتتاح/إغلاق الدرج)</summary>
[Route("api/v1/cashier-shifts")]
[Authorize]
public class CashierShiftsController : BaseApiController
{
    private readonly ICashierShiftService _service;
    public CashierShiftsController(ICashierShiftService service) => _service = service;

    /// <summary>افتتاح وردية جديدة</summary>
    [HttpPost("open")]
    public async Task<IActionResult> Open([FromBody] OpenShiftRequest request)
        => HandleResult(await _service.OpenShiftAsync(request));

    /// <summary>إغلاق الوردية الحالية</summary>
    [HttpPost("close")]
    public async Task<IActionResult> Close([FromBody] CloseShiftRequest request)
        => HandleResult(await _service.CloseShiftAsync(request));

    /// <summary>الوردية المفتوحة الحالية للمستخدم</summary>
    [HttpGet("current")]
    public async Task<IActionResult> Current()
        => HandleResult(await _service.GetCurrentShiftAsync());

    /// <summary>ملخص الوردية (معاينة قبل الإغلاق)</summary>
    /// <param name="id">معرف الوردية</param>
    [HttpGet("{id:int}/summary")]
    public async Task<IActionResult> Summary(int id)
        => HandleResult(await _service.GetShiftSummaryAsync(id));

    /// <summary>قائمة الورديات (سجل)</summary>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] ShiftListFilter filter)
        => HandleResult(await _service.ListShiftsAsync(filter));

    /// <summary>إغلاق وردية إجبارياً (مدير فقط)</summary>
    /// <param name="id">معرف الوردية</param>
    /// <param name="request">سبب الإغلاق</param>
    [HttpPost("{id:int}/force-close")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> ForceClose(int id, [FromBody] ForceCloseRequest request)
        => HandleResult(await _service.ForceCloseAsync(id, request.Reason));
}

/// <summary>طلب الإغلاق الإجباري</summary>
public record ForceCloseRequest(string Reason);
