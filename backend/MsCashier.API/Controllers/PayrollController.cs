using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة كشوف الرواتب</summary>
[Route("api/v1/payroll")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class PayrollController : BaseApiController
{
    private readonly IPayrollService _service;
    public PayrollController(IPayrollService service) => _service = service;

    /// <summary>توليد كشف رواتب</summary>
    /// <param name="request">بيانات الكشف</param>
    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GeneratePayrollRequest request)
        => HandleResult(await _service.GeneratePayrollAsync(request));

    /// <summary>اعتماد كشف رواتب</summary>
    /// <param name="request">بيانات الاعتماد</param>
    [HttpPost("approve")]
    public async Task<IActionResult> Approve([FromBody] ApprovePayrollRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("sub")!.Value);
        return HandleResult(await _service.ApprovePayrollAsync(request, userId));
    }

    /// <summary>صرف كشف رواتب</summary>
    /// <param name="request">بيانات الصرف</param>
    [HttpPost("pay")]
    public async Task<IActionResult> Pay([FromBody] PayPayrollRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("sub")!.Value);
        return HandleResult(await _service.PayPayrollAsync(request, userId));
    }

    /// <summary>عرض كشوف الرواتب مع التصفية</summary>
    /// <param name="filter">معايير التصفية</param>
    [HttpGet]
    public async Task<IActionResult> GetPayrolls([FromQuery] PayrollFilterRequest filter)
        => HandleResult(await _service.GetPayrollsAsync(filter));

    /// <summary>عرض كشف راتب بالمعرف</summary>
    /// <param name="id">معرف الكشف</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetByIdAsync(id));

    /// <summary>عرض قسيمة الراتب</summary>
    /// <param name="id">معرف الكشف</param>
    [HttpGet("{id:int}/payslip")]
    public async Task<IActionResult> GetPayslip(int id) => HandleResult(await _service.GetPayslipAsync(id));

    /// <summary>عرض سجل الرواتب الشهري</summary>
    /// <param name="year">السنة (اختياري)</param>
    [HttpGet("history")]
    public async Task<IActionResult> GetMonthlyHistory([FromQuery] int? year) => HandleResult(await _service.GetMonthlyHistoryAsync(year));

    /// <summary>حذف كشف راتب</summary>
    /// <param name="id">معرف الكشف</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeletePayrollAsync(id));
}

// ============================================================
// Branch Management (Tenant-side)
// ============================================================
