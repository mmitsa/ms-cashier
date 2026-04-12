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
public class BranchesController : BaseApiController
{
    private readonly IBranchService _service;
    public BranchesController(IBranchService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => HandleResult(await _service.GetBranchesAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetBranchByIdAsync(id));

    [HttpGet("summary")]
    public async Task<IActionResult> Summary() => HandleResult(await _service.GetSummaryAsync());

    [HttpGet("plan-info")]
    public async Task<IActionResult> PlanInfo() => HandleResult(await _service.GetPlanInfoAsync());

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBranchDto dto) => HandleResult(await _service.UpdateBranchAsync(id, dto));

    [HttpPost("{id:int}/suspend")]
    public async Task<IActionResult> Suspend(int id) => HandleResult(await _service.SuspendBranchAsync(id));

    [HttpPost("{id:int}/activate")]
    public async Task<IActionResult> Activate(int id) => HandleResult(await _service.ActivateBranchAsync(id));

    [HttpPost("assign-warehouse")]
    public async Task<IActionResult> AssignWarehouse([FromBody] AssignWarehouseToBranchDto dto) => HandleResult(await _service.AssignWarehouseAsync(dto));

    [HttpPost("unassign-warehouse/{warehouseId:int}")]
    public async Task<IActionResult> UnassignWarehouse(int warehouseId) => HandleResult(await _service.UnassignWarehouseAsync(warehouseId));

    // Branch Requests (tenant creates)
    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateBranchRequestDto dto) => HandleResult(await _service.CreateBranchRequestAsync(dto));

    [HttpGet("requests/mine")]
    public async Task<IActionResult> MyRequests() => HandleResult(await _service.GetMyRequestsAsync());

    [HttpPost("requests/{requestId:int}/pay")]
    public async Task<IActionResult> RecordPayment(int requestId, [FromBody] BranchPaymentDto dto) => HandleResult(await _service.RecordPaymentAsync(requestId, dto));
}

// ============================================================
// Branch Requests (Admin-side)
// ============================================================

