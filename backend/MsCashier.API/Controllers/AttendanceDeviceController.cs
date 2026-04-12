using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/attendance-devices")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AttendanceDeviceController : BaseApiController
{
    private readonly IAttendanceDeviceService _service;
    public AttendanceDeviceController(IAttendanceDeviceService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => HandleResult(await _service.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveDeviceRequest request) => HandleResult(await _service.SaveAsync(null, request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveDeviceRequest request) => HandleResult(await _service.SaveAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));

    [HttpPost("{id:int}/test")]
    public async Task<IActionResult> TestConnection(int id) => HandleResult(await _service.TestConnectionAsync(id));

    [HttpPost("{id:int}/sync")]
    public async Task<IActionResult> SyncDevice(int id) => HandleResult(await _service.SyncDeviceAsync(id));

    [HttpPost("sync-all")]
    public async Task<IActionResult> SyncAll() => HandleResult(await _service.SyncAllDevicesAsync());
}

// ============================================================
// AttendanceController (HR)
// ============================================================

