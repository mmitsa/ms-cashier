using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/salary-configs")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SalaryConfigController : BaseApiController
{
    private readonly ISalaryConfigService _service;
    public SalaryConfigController(ISalaryConfigService service) => _service = service;

    [HttpGet("employee/{employeeId:int}")]
    public async Task<IActionResult> GetByEmployee(int employeeId) => HandleResult(await _service.GetByEmployeeAsync(employeeId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveSalaryConfigRequest request) => HandleResult(await _service.SaveAsync(null, request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveSalaryConfigRequest request) => HandleResult(await _service.SaveAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));
}

// ============================================================
// AttendanceDeviceController
// ============================================================

