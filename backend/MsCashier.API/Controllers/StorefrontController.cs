using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

[Route("api/v1/storefront/{subdomain}")]
[AllowAnonymous]
public class StorefrontController : BaseApiController
{
    private readonly IStorefrontService _storefrontService;

    public StorefrontController(IStorefrontService storefrontService)
    {
        _storefrontService = storefrontService;
    }

    [HttpGet]
    public async Task<IActionResult> GetStore(string subdomain)
    {
        var result = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        return HandleResult(result);
    }

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

    [HttpGet("products/{productId:int}")]
    public async Task<IActionResult> GetProductById(string subdomain, int productId)
    {
        var storeResult = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        if (!storeResult.IsSuccess)
            return HandleResult(storeResult);

        var result = await _storefrontService.GetProductByIdAsync(storeResult.Data!.Id, productId);
        return HandleResult(result);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(string subdomain)
    {
        var storeResult = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        if (!storeResult.IsSuccess)
            return HandleResult(storeResult);

        var result = await _storefrontService.GetCategoriesAsync(storeResult.Data!.Id);
        return HandleResult(result);
    }

    [HttpGet("banners")]
    public async Task<IActionResult> GetBanners(string subdomain)
    {
        var storeResult = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        if (!storeResult.IsSuccess)
            return HandleResult(storeResult);

        var result = await _storefrontService.GetBannersAsync(storeResult.Data!.Id);
        return HandleResult(result);
    }

    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder(string subdomain, [FromBody] CreateOnlineOrderRequest request)
    {
        var storeResult = await _storefrontService.GetStoreBySubdomainAsync(subdomain);
        if (!storeResult.IsSuccess)
            return HandleResult(storeResult);

        var result = await _storefrontService.CreateOrderAsync(storeResult.Data!.Id, request);
        return HandleResult(result);
    }
}
