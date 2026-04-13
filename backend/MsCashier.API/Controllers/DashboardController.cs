using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>لوحة المعلومات الرئيسية</summary>
[Route("api/v1/dashboard")]
[Authorize(Roles = "SuperAdmin,Admin,Cashier")]
public class DashboardController : BaseApiController
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

    /// <summary>عرض لوحة المعلومات الرئيسية</summary>
    /// <param name="date">التاريخ (اختياري، الافتراضي: اليوم)</param>
    [HttpGet]
    [ResponseCache(Duration = 30)]
    public async Task<IActionResult> GetDashboard([FromQuery] DateTime? date)
    {
        var result = await _dashboardService.GetDashboardAsync(date ?? DateTime.UtcNow);
        return HandleResult(result);
    }
}

// ============================================================
// ReportsController
// ============================================================
