using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;


// ============================================================
// Inline helper record types used by controller actions
// ============================================================
public record PaymentDto(decimal Amount, int AccountId);
public record AdjustStockDto(int ProductId, int WarehouseId, decimal NewQuantity, string? Notes);
public record PayrollDto(int Month, int Year);
public record InstPayDto(decimal Amount);

// ============================================================
// BaseApiController
// ============================================================

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    protected IActionResult HandleResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
            return Ok(new { success = true, data = result.Data, message = result.Message });

        return BadRequest(new { success = false, errors = result.Errors });
    }
}

// ============================================================
// AuthController
// ============================================================

