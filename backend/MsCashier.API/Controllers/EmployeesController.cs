using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة الموظفين (النظام القديم)</summary>
[Route("api/v1/employees-legacy")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class EmployeesController : BaseApiController
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService) => _employeeService = employeeService;

    /// <summary>إنشاء موظف جديد</summary>
    /// <param name="request">بيانات الموظف</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
    {
        var result = await _employeeService.CreateAsync(request);
        return HandleResult(result);
    }

    /// <summary>عرض جميع الموظفين</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _employeeService.GetAllAsync();
        return HandleResult(result);
    }

    /// <summary>تسجيل حضور موظف</summary>
    /// <param name="id">معرف الموظف</param>
    /// <param name="request">بيانات الحضور</param>
    [HttpPost("{id:int}/attendance")]
    public async Task<IActionResult> RecordAttendance(int id, [FromBody] AttendanceRequest request)
    {
        var result = await _employeeService.RecordAttendanceAsync(id, request.Date, request.CheckIn, request.CheckOut, request.Status);
        return HandleResult(result);
    }

    /// <summary>معالجة الرواتب الشهرية</summary>
    /// <param name="dto">الشهر والسنة</param>
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
