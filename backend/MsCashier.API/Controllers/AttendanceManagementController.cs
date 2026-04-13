using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة الحضور والانصراف</summary>
[Route("api/v1/attendance")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AttendanceManagementController : BaseApiController
{
    private readonly IAttendanceService _service;
    public AttendanceManagementController(IAttendanceService service) => _service = service;

    /// <summary>تسجيل بصمة حضور/انصراف يدوياً</summary>
    /// <param name="request">بيانات البصمة</param>
    [HttpPost("punch")]
    public async Task<IActionResult> ManualPunch([FromBody] ManualPunchRequest request)
        => HandleResult(await _service.ManualPunchAsync(request));

    /// <summary>عرض ملخص الحضور اليومي</summary>
    /// <param name="filter">معايير التصفية</param>
    [HttpGet("daily")]
    public async Task<IActionResult> GetDailySummary([FromQuery] AttendanceFilterRequest filter)
        => HandleResult(await _service.GetDailySummaryAsync(filter));

    /// <summary>عرض ملخص الحضور الشهري</summary>
    /// <param name="month">الشهر</param>
    /// <param name="year">السنة</param>
    /// <param name="employeeId">معرف الموظف (اختياري)</param>
    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthSummary([FromQuery] int month, [FromQuery] int year, [FromQuery] int? employeeId)
        => HandleResult(await _service.GetMonthSummaryAsync(month, year, employeeId));

    /// <summary>عرض بصمات موظف في فترة محددة</summary>
    /// <param name="employeeId">معرف الموظف</param>
    /// <param name="dateFrom">تاريخ البداية</param>
    /// <param name="dateTo">تاريخ النهاية</param>
    [HttpGet("punches/{employeeId:int}")]
    public async Task<IActionResult> GetPunches(int employeeId, [FromQuery] DateOnly dateFrom, [FromQuery] DateOnly dateTo)
        => HandleResult(await _service.GetPunchesAsync(employeeId, dateFrom, dateTo));

    /// <summary>حذف بصمة</summary>
    /// <param name="punchId">معرف البصمة</param>
    [HttpDelete("punch/{punchId:long}")]
    public async Task<IActionResult> DeletePunch(long punchId)
        => HandleResult(await _service.DeletePunchAsync(punchId));
}

// ============================================================
// PayrollController
// ============================================================
