using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة المنتجات</summary>
[Route("api/v1/products")]
public class ProductsController : BaseApiController
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService) => _productService = productService;

    /// <summary>إنشاء منتج جديد</summary>
    /// <param name="request">بيانات المنتج</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
    {
        var result = await _productService.CreateAsync(request);
        return HandleResult(result);
    }

    /// <summary>البحث في المنتجات</summary>
    /// <param name="request">معايير البحث</param>
    [HttpGet("search")]
    [ResponseCache(Duration = 30)]
    public async Task<IActionResult> Search([FromQuery] ProductSearchRequest request)
    {
        var result = await _productService.SearchAsync(request);
        return HandleResult(result);
    }

    /// <summary>عرض منتج بالمعرف</summary>
    /// <param name="id">معرف المنتج</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _productService.GetByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>عرض منتج بالباركود</summary>
    /// <param name="barcode">رقم الباركود</param>
    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode)
    {
        var result = await _productService.GetByBarcodeAsync(barcode);
        return HandleResult(result);
    }

    /// <summary>تحديث بيانات منتج</summary>
    /// <param name="id">معرف المنتج</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request)
    {
        var result = await _productService.UpdateAsync(id, request);
        return HandleResult(result);
    }

    /// <summary>حذف منتج</summary>
    /// <param name="id">معرف المنتج</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _productService.DeleteAsync(id);
        return HandleResult(result);
    }

    /// <summary>عرض المنتجات منخفضة المخزون</summary>
    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var result = await _productService.GetLowStockAsync();
        return HandleResult(result);
    }

    /// <summary>تحديث جماعي (أسعار، فئة، حالة)</summary>
    [HttpPatch("bulk")]
    public async Task<IActionResult> BulkUpdate([FromBody] BulkUpdateProductsRequest request)
        => HandleResult(await _productService.BulkUpdateAsync(request));

    /// <summary>حذف جماعي</summary>
    [HttpDelete("bulk")]
    public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteProductsRequest request)
        => HandleResult(await _productService.BulkDeleteAsync(request));

    /// <summary>تحديث الباركود لمنتج محدد</summary>
    [HttpPatch("{id:int}/barcode")]
    public async Task<IActionResult> UpdateBarcode(int id, [FromBody] UpdateBarcodeRequest request)
        => HandleResult(await _productService.UpdateBarcodeAsync(id, request.Barcode));

    /// <summary>تحديث الأسعار لمنتج محدد</summary>
    [HttpPatch("{id:int}/prices")]
    public async Task<IActionResult> UpdatePrices(int id, [FromBody] UpdatePricesRequest request)
        => HandleResult(await _productService.UpdatePricesAsync(id, request));
}

// ============================================================
// CategoriesController
// ============================================================

