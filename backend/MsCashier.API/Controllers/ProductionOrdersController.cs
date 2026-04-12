using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/production-orders")]
public class ProductionOrdersController : BaseApiController
{
    private readonly IProductionOrderService _productionService;
    public ProductionOrdersController(IProductionOrderService productionService) => _productionService = productionService;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductionOrderRequest request)
        => HandleResult(await _productionService.CreateAsync(request));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _productionService.GetByIdAsync(id));

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] ProductionOrderFilterRequest request)
        => HandleResult(await _productionService.SearchAsync(request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductionOrderRequest request)
        => HandleResult(await _productionService.UpdateAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _productionService.DeleteAsync(id));

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
        => HandleResult(await _productionService.ApproveAsync(id));

    [HttpPost("{id:int}/start")]
    public async Task<IActionResult> Start(int id)
        => HandleResult(await _productionService.StartAsync(id));

    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id, [FromBody] CompleteProductionRequest request)
        => HandleResult(await _productionService.CompleteAsync(id, request));

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] string? reason)
        => HandleResult(await _productionService.CancelAsync(id, reason));
}

// ============================================================
// ProductionWasteController
// ============================================================

