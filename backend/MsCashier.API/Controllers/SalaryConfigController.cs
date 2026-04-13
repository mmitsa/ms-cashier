using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة إعدادات الرواتب</summary>
[Route("api/v1/salary-configs")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SalaryConfigController : BaseApiController
{
    private readonly ISalaryConfigService _service;
    public SalaryConfigController(ISalaryConfigService service) => _service = service;

    /// <summary>عرض إعداد راتب موظف</summary>
    /// <param name="employeeId">معرف الموظف</param>
    [HttpGet("employee/{employeeId:int}")]
    public async Task<IActionResult> GetByEmployee(int employeeId) => HandleResult(await _service.GetByEmployeeAsync(employeeId));

    /// <summary>إنشاء إعداد راتب</summary>
    /// <param name="request">بيانات الإعداد</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveSalaryConfigRequest request) => HandleResult(await _service.SaveAsync(null, request));

    /// <summary>تحديث إعداد راتب</summary>
    /// <param name="id">معرف الإعداد</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveSalaryConfigRequest request) => HandleResult(await _service.SaveAsync(id, request));

    /// <summary>حذف إعداد راتب</summary>
    /// <param name="id">معرف الإعداد</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));
}

// ============================================================
// AttendanceDeviceController
// ============================================================
