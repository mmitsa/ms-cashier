using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/production-waste")]
public class ProductionWasteController : BaseApiController
{
    private readonly IProductionWasteService _wasteService;
    public ProductionWasteController(IProductionWasteService wasteService) => _wasteService = wasteService;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWasteRequest request)
        => HandleResult(await _wasteService.CreateAsync(request));

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] WasteFilterRequest request)
        => HandleResult(await _wasteService.SearchAsync(request));

    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int? branchId)
        => HandleResult(await _wasteService.GetSummaryAsync(from, to, branchId));

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
        => HandleResult(await _wasteService.DeleteAsync(id));
}
