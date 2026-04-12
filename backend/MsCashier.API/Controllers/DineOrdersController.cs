using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[ApiController]
[Route("api/dine-orders")]
[Authorize]
public class DineOrdersController : BaseApiController
{
    private readonly IDineOrderService _service;
    public DineOrdersController(IDineOrderService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDineOrderRequest dto) => HandleResult(await _service.CreateOrderAsync(dto));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id) => HandleResult(await _service.GetByIdAsync(id));

    [HttpGet("active")]
    public async Task<IActionResult> Active() => HandleResult(await _service.GetActiveOrdersAsync());

    [HttpGet("table/{tableId:int}")]
    public async Task<IActionResult> ByTable(int tableId) => HandleResult(await _service.GetOrdersByTableAsync(tableId));

    [HttpPost("{id:long}/add-items")]
    public async Task<IActionResult> AddItems(long id, [FromBody] AddItemsToOrderRequest dto) => HandleResult(await _service.AddItemsAsync(id, dto));

    [HttpPost("{id:long}/send-kitchen")]
    public async Task<IActionResult> SendToKitchen(long id) => HandleResult(await _service.SendToKitchenAsync(id));

    [HttpPost("{id:long}/serve")]
    public async Task<IActionResult> MarkServed(long id) => HandleResult(await _service.MarkServedAsync(id));

    [HttpPost("{id:long}/cancel")]
    public async Task<IActionResult> Cancel(long id) => HandleResult(await _service.CancelOrderAsync(id));

    [HttpPost("{id:long}/bill")]
    public async Task<IActionResult> Bill(long id, [FromBody] BillOrderRequest dto) => HandleResult(await _service.BillOrderAsync(id, dto));

    // Kitchen
    [HttpGet("kitchen")]
    public async Task<IActionResult> Kitchen() => HandleResult(await _service.GetKitchenBoardAsync());

    [HttpPut("items/{itemId:long}/status")]
    public async Task<IActionResult> UpdateItemStatus(long itemId, [FromBody] UpdateOrderItemStatusRequest dto)
        => HandleResult(await _service.UpdateItemKitchenStatusAsync(itemId, dto));

    [HttpPost("{id:long}/all-ready")]
    public async Task<IActionResult> AllReady(long id) => HandleResult(await _service.MarkAllItemsReadyAsync(id));

    [HttpGet("kitchen/stats")]
    public async Task<IActionResult> KitchenStats() => HandleResult(await _service.GetKitchenStatsAsync());

    [HttpGet("kitchen/completed")]
    public async Task<IActionResult> Completed([FromQuery] int limit = 20) => HandleResult(await _service.GetCompletedOrdersAsync(limit));

    [HttpPost("{id:long}/recall")]
    public async Task<IActionResult> Recall(long id) => HandleResult(await _service.RecallOrderAsync(id));
}

// ============================================================
// Floor Sections Controller
// ============================================================

