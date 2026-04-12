using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[ApiController]
[Route("api/admin/branch-requests")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AdminBranchRequestsController : BaseApiController
{
    private readonly IBranchService _service;
    public AdminBranchRequestsController(IBranchService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int size = 20, [FromQuery] string? status = null)
        => HandleResult(await _service.GetAllRequestsAsync(page, size, status));

    [HttpPost("{requestId:int}/review")]
    public async Task<IActionResult> Review(int requestId, [FromBody] AdminReviewBranchRequestDto dto)
        => HandleResult(await _service.ReviewRequestAsync(requestId, dto));

    [HttpPost("{requestId:int}/activate")]
    public async Task<IActionResult> Activate(int requestId)
        => HandleResult(await _service.ActivateAfterPaymentAsync(requestId));
}

// ============================================================
// Restaurant Tables
// ============================================================

