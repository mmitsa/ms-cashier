using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[ApiController]
[Route("api/public/customer")]
public class CustomerPublicController : ControllerBase
{
    private readonly ICustomerOrderService _service;
    public CustomerPublicController(ICustomerOrderService service) => _service = service;

    private IActionResult HandleResult<T>(Result<T> result)
        => result.IsSuccess ? Ok(result) : BadRequest(result);

    // Store Menu
    [HttpGet("menu/{qrCode}")]
    public async Task<IActionResult> GetStoreMenu(string qrCode)
        => HandleResult(await _service.GetStoreMenuAsync(qrCode));

    // Start Session
    [HttpPost("session/{qrCode}")]
    public async Task<IActionResult> StartSession(string qrCode, [FromBody] StartSessionRequest request)
        => HandleResult(await _service.StartSessionAsync(qrCode, request));

    // Cart
    [HttpGet("cart")]
    public async Task<IActionResult> GetCart([FromHeader(Name = "X-Session-Token")] string sessionToken)
        => HandleResult(await _service.GetCartAsync(sessionToken));

    [HttpPost("cart/items")]
    public async Task<IActionResult> AddToCart([FromHeader(Name = "X-Session-Token")] string sessionToken, [FromBody] AddToCartRequest request)
        => HandleResult(await _service.AddToCartAsync(sessionToken, request));

    [HttpPut("cart/items/{itemId:long}")]
    public async Task<IActionResult> UpdateCartItem([FromHeader(Name = "X-Session-Token")] string sessionToken, long itemId, [FromBody] UpdateCartItemRequest request)
        => HandleResult(await _service.UpdateCartItemAsync(sessionToken, itemId, request));

    [HttpDelete("cart/items/{itemId:long}")]
    public async Task<IActionResult> RemoveCartItem([FromHeader(Name = "X-Session-Token")] string sessionToken, long itemId)
        => HandleResult(await _service.RemoveFromCartAsync(sessionToken, itemId));

    // Submit Order
    [HttpPost("order/submit")]
    public async Task<IActionResult> SubmitOrder([FromHeader(Name = "X-Session-Token")] string sessionToken, [FromBody] SubmitOrderRequest request)
        => HandleResult(await _service.SubmitOrderAsync(sessionToken, request));

    // Order Status
    [HttpGet("order/{orderId:long}/status")]
    public async Task<IActionResult> GetOrderStatus([FromHeader(Name = "X-Session-Token")] string sessionToken, long orderId)
        => HandleResult(await _service.GetOrderStatusAsync(sessionToken, orderId));

    // Session Orders
    [HttpGet("orders")]
    public async Task<IActionResult> GetSessionOrders([FromHeader(Name = "X-Session-Token")] string sessionToken)
        => HandleResult(await _service.GetSessionOrdersAsync(sessionToken));
}

// ============================================================
// Payment Terminals Controller
// ============================================================

