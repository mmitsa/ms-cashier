using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/dashboard")]
[Authorize(Roles = "SuperAdmin,Admin,Cashier")]
public class DashboardController : BaseApiController
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

    [HttpGet]
    public async Task<IActionResult> GetDashboard([FromQuery] DateTime? date)
    {
        var result = await _dashboardService.GetDashboardAsync(date ?? DateTime.UtcNow);
        return HandleResult(result);
    }
}

// ============================================================
// ReportsController
// ============================================================

