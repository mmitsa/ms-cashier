using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/employees")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class EmployeeDetailController : BaseApiController
{
    private readonly IEmployeeDetailService _service;
    public EmployeeDetailController(IEmployeeDetailService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly) => HandleResult(await _service.GetAllAsync(activeOnly));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeDetailRequest request) => HandleResult(await _service.CreateAsync(request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeRequest request) => HandleResult(await _service.UpdateAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));
}

// ============================================================
// SalaryConfigController
// ============================================================

