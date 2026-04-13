using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة بوابات الدفع الإلكتروني</summary>
[Route("api/v1/payment-gateways")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class PaymentGatewayController : BaseApiController
{
    private readonly IPaymentGatewayService _service;
    public PaymentGatewayController(IPaymentGatewayService service) => _service = service;

    /// <summary>عرض إعدادات بوابات الدفع</summary>
    [HttpGet("configs")]
    public async Task<IActionResult> GetConfigs() => HandleResult(await _service.GetConfigsAsync());

    /// <summary>إنشاء إعداد بوابة دفع</summary>
    /// <param name="request">بيانات البوابة</param>
    [HttpPost("configs")]
    public async Task<IActionResult> SaveConfig([FromBody] SavePaymentGatewayRequest request)
        => HandleResult(await _service.SaveConfigAsync(null, request));

    /// <summary>تحديث إعداد بوابة دفع</summary>
    /// <param name="id">معرف الإعداد</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("configs/{id:int}")]
    public async Task<IActionResult> UpdateConfig(int id, [FromBody] SavePaymentGatewayRequest request)
        => HandleResult(await _service.SaveConfigAsync(id, request));

    /// <summary>حذف إعداد بوابة دفع</summary>
    /// <param name="id">معرف الإعداد</param>
    [HttpDelete("configs/{id:int}")]
    public async Task<IActionResult> DeleteConfig(int id) => HandleResult(await _service.DeleteConfigAsync(id));

    /// <summary>اختبار اتصال بوابة الدفع</summary>
    /// <param name="id">معرف الإعداد</param>
    [HttpPost("configs/{id:int}/test")]
    public async Task<IActionResult> TestGateway(int id) => HandleResult(await _service.TestGatewayAsync(id));

    /// <summary>بدء عملية دفع إلكتروني</summary>
    /// <param name="request">بيانات الدفع</param>
    [HttpPost("initiate")]
    [Authorize]
    public async Task<IActionResult> Initiate([FromBody] InitiatePaymentRequest request)
        => HandleResult(await _service.InitiatePaymentAsync(request));

    /// <summary>التحقق من حالة عملية دفع</summary>
    /// <param name="paymentId">معرف الدفعة</param>
    [HttpGet("status/{paymentId:long}")]
    [Authorize]
    public async Task<IActionResult> CheckStatus(long paymentId) => HandleResult(await _service.CheckPaymentStatusAsync(paymentId));

    /// <summary>استقبال رد بوابة الدفع (Callback)</summary>
    /// <param name="gatewayType">نوع البوابة</param>
    /// <param name="id">معرف العملية</param>
    /// <param name="status">حالة العملية</param>
    [HttpPost("callback/{gatewayType}")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback(string gatewayType, [FromQuery] string id, [FromQuery] string status)
    {
        string? rawBody = null;
        using (var reader = new StreamReader(Request.Body)) rawBody = await reader.ReadToEndAsync();
        var result = await _service.HandleCallbackAsync(gatewayType, id, status, rawBody);
        return HandleResult(result);
    }
}

// ============================================================
// OtpController
// ============================================================
