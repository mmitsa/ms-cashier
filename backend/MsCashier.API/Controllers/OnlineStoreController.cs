using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة المتجر الإلكتروني</summary>
[Route("api/v1/online-store")]
public class OnlineStoreController : BaseApiController
{
    private readonly IOnlineStoreService _storeService;

    public OnlineStoreController(IOnlineStoreService storeService)
    {
        _storeService = storeService;
    }

    /// <summary>عرض بيانات المتجر الإلكتروني</summary>
    [HttpGet]
    public async Task<IActionResult> GetStore()
    {
        var result = await _storeService.GetStoreAsync();
        return HandleResult(result);
    }

    /// <summary>إنشاء أو تحديث المتجر الإلكتروني</summary>
    /// <param name="request">بيانات المتجر</param>
    [HttpPost]
    public async Task<IActionResult> CreateOrUpdateStore([FromBody] CreateOnlineStoreRequest request)
    {
        var result = await _storeService.CreateOrUpdateStoreAsync(request);
        return HandleResult(result);
    }

    // ── Banners ──────────────────────────────────────────────

    /// <summary>عرض بانرات المتجر</summary>
    [HttpGet("banners")]
    public async Task<IActionResult> GetBanners()
    {
        var result = await _storeService.GetBannersAsync();
        return HandleResult(result);
    }

    /// <summary>حفظ بانر جديد أو تحديثه</summary>
    /// <param name="banner">بيانات البانر</param>
    [HttpPost("banners")]
    public async Task<IActionResult> SaveBanner([FromBody] StoreBannerDto banner)
    {
        var result = await _storeService.SaveBannerAsync(banner);
        return HandleResult(result);
    }

    /// <summary>حذف بانر</summary>
    /// <param name="id">معرف البانر</param>
    [HttpDelete("banners/{id:int}")]
    public async Task<IActionResult> DeleteBanner(int id)
    {
        var result = await _storeService.DeleteBannerAsync(id);
        return HandleResult(result);
    }

    // ── Orders ───────────────────────────────────────────────

    /// <summary>عرض طلبات المتجر الإلكتروني</summary>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
    /// <param name="status">حالة الطلب</param>
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] OnlineOrderStatus? status = null)
    {
        var result = await _storeService.GetOrdersAsync(page, pageSize, status);
        return HandleResult(result);
    }

    /// <summary>عرض طلب بالمعرف</summary>
    /// <param name="id">معرف الطلب</param>
    [HttpGet("orders/{id:long}")]
    public async Task<IActionResult> GetOrderById(long id)
    {
        var result = await _storeService.GetOrderByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>تحديث حالة طلب</summary>
    /// <param name="id">معرف الطلب</param>
    /// <param name="request">الحالة الجديدة</param>
    [HttpPut("orders/{id:long}/status")]
    public async Task<IActionResult> UpdateOrderStatus(long id, [FromBody] UpdateOrderStatusRequest request)
    {
        var result = await _storeService.UpdateOrderStatusAsync(id, request);
        return HandleResult(result);
    }

    /// <summary>ربط طلب بفاتورة</summary>
    /// <param name="id">معرف الطلب</param>
    /// <param name="invoiceId">معرف الفاتورة</param>
    [HttpPut("orders/{id:long}/link-invoice/{invoiceId:long}")]
    public async Task<IActionResult> LinkOrderToInvoice(long id, long invoiceId)
    {
        var result = await _storeService.LinkOrderToInvoiceAsync(id, invoiceId);
        return HandleResult(result);
    }

    // ── Payment Configs ──────────────────────────────────────

    /// <summary>عرض إعدادات الدفع</summary>
    [HttpGet("payment-configs")]
    public async Task<IActionResult> GetPaymentConfigs()
    {
        var result = await _storeService.GetPaymentConfigsAsync();
        return HandleResult(result);
    }

    /// <summary>حفظ إعدادات الدفع</summary>
    /// <param name="config">إعدادات الدفع</param>
    [HttpPost("payment-configs")]
    public async Task<IActionResult> SavePaymentConfig([FromBody] OnlinePaymentConfigDto config)
    {
        var result = await _storeService.SavePaymentConfigAsync(config);
        return HandleResult(result);
    }

    // ── Shipping Configs ─────────────────────────────────────

    /// <summary>عرض إعدادات الشحن</summary>
    [HttpGet("shipping-configs")]
    public async Task<IActionResult> GetShippingConfigs()
    {
        var result = await _storeService.GetShippingConfigsAsync();
        return HandleResult(result);
    }

    /// <summary>حفظ إعدادات الشحن</summary>
    /// <param name="config">إعدادات الشحن</param>
    [HttpPost("shipping-configs")]
    public async Task<IActionResult> SaveShippingConfig([FromBody] StoreShippingConfigDto config)
    {
        var result = await _storeService.SaveShippingConfigAsync(config);
        return HandleResult(result);
    }

    // ── Dashboard ────────────────────────────────────────────

    /// <summary>لوحة معلومات المتجر الإلكتروني</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _storeService.GetDashboardAsync();
        return HandleResult(result);
    }
}
