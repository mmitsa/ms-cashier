using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/employees-legacy")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class EmployeesController : BaseApiController
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService) => _employeeService = employeeService;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
    {
        var result = await _employeeService.CreateAsync(request);
        return HandleResult(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _employeeService.GetAllAsync();
        return HandleResult(result);
    }

    [HttpPost("{id:int}/attendance")]
    public async Task<IActionResult> RecordAttendance(int id, [FromBody] AttendanceRequest request)
    {
        var result = await _employeeService.RecordAttendanceAsync(id, request.Date, request.CheckIn, request.CheckOut, request.Status);
        return HandleResult(result);
    }

    [HttpPost("payroll")]
    public async Task<IActionResult> ProcessPayroll([FromBody] PayrollDto dto)
    {
        var result = await _employeeService.ProcessPayrollAsync(dto.Month, dto.Year);
        return HandleResult(result);
    }
}

// ============================================================
// InstallmentsController
// ============================================================

