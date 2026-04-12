using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/kitchen-stations")]
public class KitchenStationsController : BaseApiController
{
    private readonly IKitchenStationService _stationService;
    public KitchenStationsController(IKitchenStationService stationService) => _stationService = stationService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId)
        => HandleResult(await _stationService.GetAllAsync(branchId));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _stationService.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveKitchenStationRequest request)
        => HandleResult(await _stationService.SaveAsync(null, request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveKitchenStationRequest request)
        => HandleResult(await _stationService.SaveAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _stationService.DeleteAsync(id));

    [HttpPost("assign-product")]
    public async Task<IActionResult> AssignProduct([FromBody] AssignProductToStationRequest request)
        => HandleResult(await _stationService.AssignProductAsync(request));

    [HttpDelete("remove-product/{productId:int}")]
    public async Task<IActionResult> RemoveProduct(int productId)
        => HandleResult(await _stationService.RemoveProductAsync(productId));

    [HttpGet("product-assignments")]
    public async Task<IActionResult> GetAssignments([FromQuery] int? stationId)
        => HandleResult(await _stationService.GetProductAssignmentsAsync(stationId));
}

// ============================================================
// ProductionOrdersController
// ============================================================

