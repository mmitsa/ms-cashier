using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TablesController : BaseApiController
{
    private readonly ITableService _service;
    public TablesController(ITableService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId) => HandleResult(await _service.GetTablesAsync(branchId));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveTableRequest dto) => HandleResult(await _service.SaveAsync(null, dto));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveTableRequest dto) => HandleResult(await _service.SaveAsync(id, dto));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTableStatusRequest dto)
        => HandleResult(await _service.UpdateStatusAsync(id, dto));
}

// ============================================================
// Dine / Waiter Orders
// ============================================================

