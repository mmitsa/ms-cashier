using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة بيانات الموظفين التفصيلية</summary>
[Route("api/v1/employees")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class EmployeeDetailController : BaseApiController
{
    private readonly IEmployeeDetailService _service;
    public EmployeeDetailController(IEmployeeDetailService service) => _service = service;

    /// <summary>عرض جميع الموظفين</summary>
    /// <param name="activeOnly">النشطون فقط (اختياري)</param>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly) => HandleResult(await _service.GetAllAsync(activeOnly));

    /// <summary>عرض موظف بالمعرف</summary>
    /// <param name="id">معرف الموظف</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetByIdAsync(id));

    /// <summary>إنشاء موظف جديد</summary>
    /// <param name="request">بيانات الموظف</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeDetailRequest request) => HandleResult(await _service.CreateAsync(request));

    /// <summary>تحديث بيانات موظف</summary>
    /// <param name="id">معرف الموظف</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeRequest request) => HandleResult(await _service.UpdateAsync(id, request));

    /// <summary>حذف موظف</summary>
    /// <param name="id">معرف الموظف</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));
}

// ============================================================
// SalaryConfigController
// ============================================================
