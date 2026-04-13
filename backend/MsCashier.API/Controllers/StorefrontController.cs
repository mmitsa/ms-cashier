using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>واجهة المتجر العامة (بدون مصادقة)</summary>
[Route("api/v1/storefront/{subdomain}")]
[AllowAnonymous]
[ResponseCache(Duration = 60)]
public class StorefrontController : BaseApiController
{
    private readonly IStorefrontService _storefrontService;

    public StorefrontController(IStorefrontService storefrontService)
    {
        _storefrontService = storefrontService;
    }

    /// <summary>عرض بيانات المتجر بالنطاق الفرعي</summary>
    /// <param name="subdomain">النطاق الفرعي للمتجر</param>
    [HttpGet]
    public async Task<IActionResult> GetStore(string subdomain)
    {
        var result = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        return HandleResult(result);
    }

    /// <summary>عرض منتجات المتجر</summary>
    /// <param name="subdomain">النطاق الفرعي</param>
    /// <param name="categoryId">معرف التصنيف (اختياري)</param>
    /// <param name="search">نص البحث</param>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        string subdomain,
        [FromQuery] int? categoryId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var storeResult = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        if (!storeResult.IsSuccess)
            return HandleResult(storeResult);

        var result = await _storefrontService.GetProductsAsync(storeResult.Data!.Id, categoryId, search, page, pageSize);
        return HandleResult(result);
    }

    /// <summary>عرض منتج محدد من المتجر</summary>
    /// <param name="subdomain">النطاق الفرعي</param>
    /// <param name="productId">معرف المنتج</param>
    [HttpGet("products/{productId:int}")]
    public async Task<IActionResult> GetProductById(string subdomain, int productId)
    {
        var storeResult = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        if (!storeResult.IsSuccess)
            return HandleResult(storeResult);

        var result = await _storefrontService.GetProductByIdAsync(storeResult.Data!.Id, productId);
        return HandleResult(result);
    }

    /// <summary>عرض تصنيفات المتجر</summary>
    /// <param name="subdomain">النطاق الفرعي</param>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(string subdomain)
    {
        var storeResult = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        if (!storeResult.IsSuccess)
            return HandleResult(storeResult);

        var result = await _storefrontService.GetCategoriesAsync(storeResult.Data!.Id);
        return HandleResult(result);
    }

    /// <summary>عرض بانرات المتجر</summary>
    /// <param name="subdomain">النطاق الفرعي</param>
    [HttpGet("banners")]
    public async Task<IActionResult> GetBanners(string subdomain)
    {
        var storeResult = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        if (!storeResult.IsSuccess)
            return HandleResult(storeResult);

        var result = await _storefrontService.GetBannersAsync(storeResult.Data!.Id);
        return HandleResult(result);
    }

    /// <summary>إنشاء طلب جديد من المتجر</summary>
    /// <param name="subdomain">النطاق الفرعي</param>
    /// <param name="request">بيانات الطلب</param>
    [HttpPost("orders")]
    [ResponseCache(Duration = 0, NoStore = true)]
    public async Task<IActionResult> CreateOrder(string subdomain, [FromBody] CreateOnlineOrderRequest request)
    {
        var storeResult = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        if (!storeResult.IsSuccess)
            return HandleResult(storeResult);

        var result = await _storefrontService.CreateOrderAsync(storeResult.Data!.Id, request);
        return HandleResult(result);
    }
}
