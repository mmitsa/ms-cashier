using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/reports")]
public class ReportsController : BaseApiController
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService) => _reportService = reportService;

    [HttpGet("sales")]
    public async Task<IActionResult> GetSalesReport(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] int? categoryId,
        [FromQuery] int? contactId)
    {
        var result = await _reportService.GetSalesReportAsync(from, to, categoryId, contactId);
        return HandleResult(result);
    }

    [HttpGet("profit")]
    public async Task<IActionResult> GetProfitReport(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] int? productId)
    {
        var result = await _reportService.GetProfitReportAsync(from, to, productId);
        return HandleResult(result);
    }
}

// ============================================================
// ZatcaController
// ============================================================

