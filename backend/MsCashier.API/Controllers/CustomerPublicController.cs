using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>واجهة الطلب العامة للعملاء (بدون مصادقة)</summary>
[ApiController]
[Route("api/public/customer")]
public class CustomerPublicController : ControllerBase
{
    private readonly ICustomerOrderService _service;
    public CustomerPublicController(ICustomerOrderService service) => _service = service;

    private IActionResult HandleResult<T>(Result<T> result)
        => result.IsSuccess ? Ok(result) : BadRequest(result);

    /// <summary>عرض قائمة المتجر بكود QR</summary>
    /// <param name="qrCode">كود QR للطاولة</param>
    [HttpGet("menu/{qrCode}")]
    public async Task<IActionResult> GetStoreMenu(string qrCode)
        => HandleResult(await _service.GetStoreMenuAsync(qrCode));

    /// <summary>بدء جلسة طلب جديدة</summary>
    /// <param name="qrCode">كود QR للطاولة</param>
    /// <param name="request">بيانات الجلسة</param>
    [HttpPost("session/{qrCode}")]
    public async Task<IActionResult> StartSession(string qrCode, [FromBody] StartSessionRequest request)
        => HandleResult(await _service.StartSessionAsync(qrCode, request));

    /// <summary>عرض سلة المشتريات</summary>
    /// <param name="sessionToken">رمز الجلسة</param>
    [HttpGet("cart")]
    public async Task<IActionResult> GetCart([FromHeader(Name = "X-Session-Token")] string sessionToken)
        => HandleResult(await _service.GetCartAsync(sessionToken));

    /// <summary>إضافة صنف للسلة</summary>
    /// <param name="sessionToken">رمز الجلسة</param>
    /// <param name="request">بيانات الصنف</param>
    [HttpPost("cart/items")]
    public async Task<IActionResult> AddToCart([FromHeader(Name = "X-Session-Token")] string sessionToken, [FromBody] AddToCartRequest request)
        => HandleResult(await _service.AddToCartAsync(sessionToken, request));

    /// <summary>تحديث صنف في السلة</summary>
    /// <param name="sessionToken">رمز الجلسة</param>
    /// <param name="itemId">معرف الصنف</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("cart/items/{itemId:long}")]
    public async Task<IActionResult> UpdateCartItem([FromHeader(Name = "X-Session-Token")] string sessionToken, long itemId, [FromBody] UpdateCartItemRequest request)
        => HandleResult(await _service.UpdateCartItemAsync(sessionToken, itemId, request));

    /// <summary>إزالة صنف من السلة</summary>
    /// <param name="sessionToken">رمز الجلسة</param>
    /// <param name="itemId">معرف الصنف</param>
    [HttpDelete("cart/items/{itemId:long}")]
    public async Task<IActionResult> RemoveCartItem([FromHeader(Name = "X-Session-Token")] string sessionToken, long itemId)
        => HandleResult(await _service.RemoveFromCartAsync(sessionToken, itemId));

    /// <summary>تأكيد وإرسال الطلب</summary>
    /// <param name="sessionToken">رمز الجلسة</param>
    /// <param name="request">بيانات الطلب</param>
    [HttpPost("order/submit")]
    public async Task<IActionResult> SubmitOrder([FromHeader(Name = "X-Session-Token")] string sessionToken, [FromBody] SubmitOrderRequest request)
        => HandleResult(await _service.SubmitOrderAsync(sessionToken, request));

    /// <summary>متابعة حالة الطلب</summary>
    /// <param name="sessionToken">رمز الجلسة</param>
    /// <param name="orderId">معرف الطلب</param>
    [HttpGet("order/{orderId:long}/status")]
    public async Task<IActionResult> GetOrderStatus([FromHeader(Name = "X-Session-Token")] string sessionToken, long orderId)
        => HandleResult(await _service.GetOrderStatusAsync(sessionToken, orderId));

    /// <summary>عرض طلبات الجلسة الحالية</summary>
    /// <param name="sessionToken">رمز الجلسة</param>
    [HttpGet("orders")]
    public async Task<IActionResult> GetSessionOrders([FromHeader(Name = "X-Session-Token")] string sessionToken)
        => HandleResult(await _service.GetSessionOrdersAsync(sessionToken));
}

// ============================================================
// Payment Terminals Controller
// ============================================================
