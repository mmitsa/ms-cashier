using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>إدارة مفاتيح API العامة والويب هوك</summary>
[Route("api/v1/api-management")]
public class PublicApiManagementController : BaseApiController
{
    private readonly IPublicApiService _publicApiService;

    public PublicApiManagementController(IPublicApiService publicApiService) =>
        _publicApiService = publicApiService;

    // ════════════════════════════════════════════════════════
    // API Keys
    // ════════════════════════════════════════════════════════

    /// <summary>عرض جميع مفاتيح API</summary>
    [HttpGet("keys")]
    public async Task<IActionResult> GetKeys()
        => HandleResult(await _publicApiService.GetKeysAsync());

    /// <summary>إنشاء مفتاح API جديد</summary>
    /// <param name="request">بيانات المفتاح</param>
    [HttpPost("keys")]
    public async Task<IActionResult> CreateKey([FromBody] CreateApiKeyRequest request)
        => HandleResult(await _publicApiService.CreateKeyAsync(request.Name, request.Scopes, request.ExpiresAt));

    /// <summary>إلغاء مفتاح API</summary>
    /// <param name="id">معرف المفتاح</param>
    [HttpPost("keys/{id:int}/revoke")]
    public async Task<IActionResult> RevokeKey(int id)
        => HandleResult(await _publicApiService.RevokeKeyAsync(id));

    // ════════════════════════════════════════════════════════
    // Webhooks
    // ════════════════════════════════════════════════════════

    /// <summary>عرض جميع اشتراكات الويب هوك</summary>
    [HttpGet("webhooks")]
    public async Task<IActionResult> GetWebhooks()
        => HandleResult(await _publicApiService.GetSubscriptionsAsync());

    /// <summary>إنشاء اشتراك ويب هوك جديد</summary>
    /// <param name="request">بيانات الاشتراك</param>
    [HttpPost("webhooks")]
    public async Task<IActionResult> CreateWebhook([FromBody] CreateWebhookRequest request)
        => HandleResult(await _publicApiService.CreateSubscriptionAsync(request));

    /// <summary>تحديث اشتراك ويب هوك</summary>
    /// <param name="id">معرف الاشتراك</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("webhooks/{id:int}")]
    public async Task<IActionResult> UpdateWebhook(int id, [FromBody] UpdateWebhookRequest request)
        => HandleResult(await _publicApiService.UpdateSubscriptionAsync(id, request));

    /// <summary>حذف اشتراك ويب هوك</summary>
    /// <param name="id">معرف الاشتراك</param>
    [HttpDelete("webhooks/{id:int}")]
    public async Task<IActionResult> DeleteWebhook(int id)
        => HandleResult(await _publicApiService.DeleteSubscriptionAsync(id));

    /// <summary>عرض سجل تسليمات ويب هوك</summary>
    /// <param name="subscriptionId">معرف الاشتراك</param>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
    [HttpGet("webhooks/{subscriptionId:int}/deliveries")]
    public async Task<IActionResult> GetDeliveries(int subscriptionId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => HandleResult(await _publicApiService.GetDeliveriesAsync(subscriptionId, page, pageSize));

    /// <summary>اختبار ويب هوك</summary>
    /// <param name="subscriptionId">معرف الاشتراك</param>
    [HttpPost("webhooks/{subscriptionId:int}/test")]
    public async Task<IActionResult> TestWebhook(int subscriptionId)
        => HandleResult(await _publicApiService.TestWebhookAsync(subscriptionId));
}
