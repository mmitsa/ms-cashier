using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/payroll")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class PayrollController : BaseApiController
{
    private readonly IPayrollService _service;
    public PayrollController(IPayrollService service) => _service = service;

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GeneratePayrollRequest request)
        => HandleResult(await _service.GeneratePayrollAsync(request));

    [HttpPost("approve")]
    public async Task<IActionResult> Approve([FromBody] ApprovePayrollRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("sub")!.Value);
        return HandleResult(await _service.ApprovePayrollAsync(request, userId));
    }

    [HttpPost("pay")]
    public async Task<IActionResult> Pay([FromBody] PayPayrollRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("sub")!.Value);
        return HandleResult(await _service.PayPayrollAsync(request, userId));
    }

    [HttpGet]
    public async Task<IActionResult> GetPayrolls([FromQuery] PayrollFilterRequest filter)
        => HandleResult(await _service.GetPayrollsAsync(filter));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetByIdAsync(id));

    [HttpGet("{id:int}/payslip")]
    public async Task<IActionResult> GetPayslip(int id) => HandleResult(await _service.GetPayslipAsync(id));

    [HttpGet("history")]
    public async Task<IActionResult> GetMonthlyHistory([FromQuery] int? year) => HandleResult(await _service.GetMonthlyHistoryAsync(year));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeletePayrollAsync(id));
}

// ============================================================
// Branch Management (Tenant-side)
// ============================================================

