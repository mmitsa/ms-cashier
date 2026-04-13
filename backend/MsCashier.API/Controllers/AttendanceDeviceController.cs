using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة أجهزة الحضور والانصراف</summary>
[Route("api/v1/attendance-devices")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AttendanceDeviceController : BaseApiController
{
    private readonly IAttendanceDeviceService _service;
    public AttendanceDeviceController(IAttendanceDeviceService service) => _service = service;

    /// <summary>عرض جميع أجهزة الحضور</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() => HandleResult(await _service.GetAllAsync());

    /// <summary>إنشاء جهاز حضور جديد</summary>
    /// <param name="request">بيانات الجهاز</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveDeviceRequest request) => HandleResult(await _service.SaveAsync(null, request));

    /// <summary>تحديث بيانات جهاز حضور</summary>
    /// <param name="id">معرف الجهاز</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveDeviceRequest request) => HandleResult(await _service.SaveAsync(id, request));

    /// <summary>حذف جهاز حضور</summary>
    /// <param name="id">معرف الجهاز</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));

    /// <summary>اختبار اتصال جهاز الحضور</summary>
    /// <param name="id">معرف الجهاز</param>
    [HttpPost("{id:int}/test")]
    public async Task<IActionResult> TestConnection(int id) => HandleResult(await _service.TestConnectionAsync(id));

    /// <summary>مزامنة بيانات جهاز حضور</summary>
    /// <param name="id">معرف الجهاز</param>
    [HttpPost("{id:int}/sync")]
    public async Task<IActionResult> SyncDevice(int id) => HandleResult(await _service.SyncDeviceAsync(id));

    /// <summary>مزامنة جميع الأجهزة</summary>
    [HttpPost("sync-all")]
    public async Task<IActionResult> SyncAll() => HandleResult(await _service.SyncAllDevicesAsync());
}

// ============================================================
// AttendanceController (HR)
// ============================================================
