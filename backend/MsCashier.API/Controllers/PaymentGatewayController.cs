using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/payment-gateways")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class PaymentGatewayController : BaseApiController
{
    private readonly IPaymentGatewayService _service;
    public PaymentGatewayController(IPaymentGatewayService service) => _service = service;

    [HttpGet("configs")]
    public async Task<IActionResult> GetConfigs() => HandleResult(await _service.GetConfigsAsync());

    [HttpPost("configs")]
    public async Task<IActionResult> SaveConfig([FromBody] SavePaymentGatewayRequest request)
        => HandleResult(await _service.SaveConfigAsync(null, request));

    [HttpPut("configs/{id:int}")]
    public async Task<IActionResult> UpdateConfig(int id, [FromBody] SavePaymentGatewayRequest request)
        => HandleResult(await _service.SaveConfigAsync(id, request));

    [HttpDelete("configs/{id:int}")]
    public async Task<IActionResult> DeleteConfig(int id) => HandleResult(await _service.DeleteConfigAsync(id));

    [HttpPost("configs/{id:int}/test")]
    public async Task<IActionResult> TestGateway(int id) => HandleResult(await _service.TestGatewayAsync(id));

    [HttpPost("initiate")]
    [Authorize]
    public async Task<IActionResult> Initiate([FromBody] InitiatePaymentRequest request)
        => HandleResult(await _service.InitiatePaymentAsync(request));

    [HttpGet("status/{paymentId:long}")]
    [Authorize]
    public async Task<IActionResult> CheckStatus(long paymentId) => HandleResult(await _service.CheckPaymentStatusAsync(paymentId));

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

