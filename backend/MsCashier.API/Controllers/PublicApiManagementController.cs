using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

[Route("api/v1/api-management")]
public class PublicApiManagementController : BaseApiController
{
    private readonly IPublicApiService _publicApiService;

    public PublicApiManagementController(IPublicApiService publicApiService) =>
        _publicApiService = publicApiService;

    // ════════════════════════════════════════════════════════
    // API Keys
    // ════════════════════════════════════════════════════════

    [HttpGet("keys")]
    public async Task<IActionResult> GetKeys()
        => HandleResult(await _publicApiService.GetKeysAsync());

    [HttpPost("keys")]
    public async Task<IActionResult> CreateKey([FromBody] CreateApiKeyRequest request)
        => HandleResult(await _publicApiService.CreateKeyAsync(request.Name, request.Scopes, request.ExpiresAt));

    [HttpPost("keys/{id:int}/revoke")]
    public async Task<IActionResult> RevokeKey(int id)
        => HandleResult(await _publicApiService.RevokeKeyAsync(id));

    // ════════════════════════════════════════════════════════
    // Webhooks
    // ════════════════════════════════════════════════════════

    [HttpGet("webhooks")]
    public async Task<IActionResult> GetWebhooks()
        => HandleResult(await _publicApiService.GetSubscriptionsAsync());

    [HttpPost("webhooks")]
    public async Task<IActionResult> CreateWebhook([FromBody] CreateWebhookRequest request)
        => HandleResult(await _publicApiService.CreateSubscriptionAsync(request));

    [HttpPut("webhooks/{id:int}")]
    public async Task<IActionResult> UpdateWebhook(int id, [FromBody] UpdateWebhookRequest request)
        => HandleResult(await _publicApiService.UpdateSubscriptionAsync(id, request));

    [HttpDelete("webhooks/{id:int}")]
    public async Task<IActionResult> DeleteWebhook(int id)
        => HandleResult(await _publicApiService.DeleteSubscriptionAsync(id));

    [HttpGet("webhooks/{subscriptionId:int}/deliveries")]
    public async Task<IActionResult> GetDeliveries(int subscriptionId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => HandleResult(await _publicApiService.GetDeliveriesAsync(subscriptionId, page, pageSize));

    [HttpPost("webhooks/{subscriptionId:int}/test")]
    public async Task<IActionResult> TestWebhook(int subscriptionId)
        => HandleResult(await _publicApiService.TestWebhookAsync(subscriptionId));
}
