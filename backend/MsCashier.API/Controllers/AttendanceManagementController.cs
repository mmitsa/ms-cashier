using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/attendance")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AttendanceManagementController : BaseApiController
{
    private readonly IAttendanceService _service;
    public AttendanceManagementController(IAttendanceService service) => _service = service;

    [HttpPost("punch")]
    public async Task<IActionResult> ManualPunch([FromBody] ManualPunchRequest request)
        => HandleResult(await _service.ManualPunchAsync(request));

    [HttpGet("daily")]
    public async Task<IActionResult> GetDailySummary([FromQuery] AttendanceFilterRequest filter)
        => HandleResult(await _service.GetDailySummaryAsync(filter));

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthSummary([FromQuery] int month, [FromQuery] int year, [FromQuery] int? employeeId)
        => HandleResult(await _service.GetMonthSummaryAsync(month, year, employeeId));

    [HttpGet("punches/{employeeId:int}")]
    public async Task<IActionResult> GetPunches(int employeeId, [FromQuery] DateOnly dateFrom, [FromQuery] DateOnly dateTo)
        => HandleResult(await _service.GetPunchesAsync(employeeId, dateFrom, dateTo));

    [HttpDelete("punch/{punchId:long}")]
    public async Task<IActionResult> DeletePunch(long punchId)
        => HandleResult(await _service.DeletePunchAsync(punchId));
}

// ============================================================
// PayrollController
// ============================================================

