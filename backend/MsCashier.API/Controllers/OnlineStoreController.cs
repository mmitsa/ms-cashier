using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/online-store")]
public class OnlineStoreController : BaseApiController
{
    private readonly IOnlineStoreService _storeService;

    public OnlineStoreController(IOnlineStoreService storeService)
    {
        _storeService = storeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetStore()
    {
        var result = await _storeService.GetStoreAsync();
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrUpdateStore([FromBody] CreateOnlineStoreRequest request)
    {
        var result = await _storeService.CreateOrUpdateStoreAsync(request);
        return HandleResult(result);
    }

    // ── Banners ──────────────────────────────────────────────

    [HttpGet("banners")]
    public async Task<IActionResult> GetBanners()
    {
        var result = await _storeService.GetBannersAsync();
        return HandleResult(result);
    }

    [HttpPost("banners")]
    public async Task<IActionResult> SaveBanner([FromBody] StoreBannerDto banner)
    {
        var result = await _storeService.SaveBannerAsync(banner);
        return HandleResult(result);
    }

    [HttpDelete("banners/{id:int}")]
    public async Task<IActionResult> DeleteBanner(int id)
    {
        var result = await _storeService.DeleteBannerAsync(id);
        return HandleResult(result);
    }

    // ── Orders ───────────────────────────────────────────────

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] OnlineOrderStatus? status = null)
    {
        var result = await _storeService.GetOrdersAsync(page, pageSize, status);
        return HandleResult(result);
    }

    [HttpGet("orders/{id:long}")]
    public async Task<IActionResult> GetOrderById(long id)
    {
        var result = await _storeService.GetOrderByIdAsync(id);
        return HandleResult(result);
    }

    [HttpPut("orders/{id:long}/status")]
    public async Task<IActionResult> UpdateOrderStatus(long id, [FromBody] UpdateOrderStatusRequest request)
    {
        var result = await _storeService.UpdateOrderStatusAsync(id, request);
        return HandleResult(result);
    }

    [HttpPut("orders/{id:long}/link-invoice/{invoiceId:long}")]
    public async Task<IActionResult> LinkOrderToInvoice(long id, long invoiceId)
    {
        var result = await _storeService.LinkOrderToInvoiceAsync(id, invoiceId);
        return HandleResult(result);
    }

    // ── Payment Configs ──────────────────────────────────────

    [HttpGet("payment-configs")]
    public async Task<IActionResult> GetPaymentConfigs()
    {
        var result = await _storeService.GetPaymentConfigsAsync();
        return HandleResult(result);
    }

    [HttpPost("payment-configs")]
    public async Task<IActionResult> SavePaymentConfig([FromBody] OnlinePaymentConfigDto config)
    {
        var result = await _storeService.SavePaymentConfigAsync(config);
        return HandleResult(result);
    }

    // ── Shipping Configs ─────────────────────────────────────

    [HttpGet("shipping-configs")]
    public async Task<IActionResult> GetShippingConfigs()
    {
        var result = await _storeService.GetShippingConfigsAsync();
        return HandleResult(result);
    }

    [HttpPost("shipping-configs")]
    public async Task<IActionResult> SaveShippingConfig([FromBody] StoreShippingConfigDto config)
    {
        var result = await _storeService.SaveShippingConfigAsync(config);
        return HandleResult(result);
    }

    // ── Dashboard ────────────────────────────────────────────

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _storeService.GetDashboardAsync();
        return HandleResult(result);
    }
}
