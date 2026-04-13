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

/// <summary>بيانات الدفع</summary>
public record PaymentDto(decimal Amount, int AccountId);
/// <summary>بيانات تعديل المخزون</summary>
public record AdjustStockDto(int ProductId, int WarehouseId, decimal NewQuantity, string? Notes);
/// <summary>بيانات الرواتب</summary>
public record PayrollDto(int Month, int Year);
/// <summary>بيانات دفعة القسط</summary>
public record InstPayDto(decimal Amount);

// ============================================================
// BaseApiController
// ============================================================

/// <summary>الوحدة الأساسية لجميع المتحكمات</summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>معالجة النتيجة وإرجاع الاستجابة المناسبة</summary>
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

