using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>إدارة متغيرات المنتجات (الألوان، الأحجام، إلخ)</summary>
[Route("api/v1/product-variants")]
[Authorize]
public class ProductVariantsController : BaseApiController
{
    private readonly IProductVariantService _variantService;

    public ProductVariantsController(IProductVariantService variantService) => _variantService = variantService;

    /// <summary>عرض متغيرات منتج محدد</summary>
    /// <param name="productId">معرف المنتج</param>
    [HttpGet("{productId:int}")]
    public async Task<IActionResult> GetProductVariants(int productId)
        => HandleResult(await _variantService.GetProductVariantsAsync(productId));

    /// <summary>تعيين خيارات المتغيرات للمنتج</summary>
    /// <param name="request">خيارات المتغيرات</param>
    [HttpPost("options")]
    public async Task<IActionResult> SetVariantOptions([FromBody] CreateVariantOptionsRequest request)
        => HandleResult(await _variantService.SetVariantOptionsAsync(request));

    /// <summary>توليد المتغيرات تلقائياً من الخيارات</summary>
    /// <param name="request">بيانات التوليد</param>
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateVariants([FromBody] GenerateVariantsRequest request)
        => HandleResult(await _variantService.GenerateVariantsAsync(request));

    /// <summary>تحديث بيانات متغير</summary>
    /// <param name="variantId">معرف المتغير</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{variantId:int}")]
    public async Task<IActionResult> UpdateVariant(int variantId, [FromBody] UpdateVariantRequest request)
        => HandleResult(await _variantService.UpdateVariantAsync(variantId, request));

    /// <summary>حذف متغير</summary>
    /// <param name="variantId">معرف المتغير</param>
    [HttpDelete("{variantId:int}")]
    public async Task<IActionResult> DeleteVariant(int variantId)
        => HandleResult(await _variantService.DeleteVariantAsync(variantId));

    /// <summary>البحث عن متغير بالباركود</summary>
    /// <param name="barcode">رقم الباركود</param>
    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode)
        => HandleResult(await _variantService.GetVariantByBarcodeAsync(barcode));
}
