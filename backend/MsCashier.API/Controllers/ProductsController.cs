using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>إدارة المنتجات</summary>
[Route("api/v1/products")]
public class ProductsController : BaseApiController
{
    private readonly IProductService _productService;
    private readonly ICurrentTenantService _tenant;
    private readonly IWebHostEnvironment _env;

    public ProductsController(
        IProductService productService,
        ICurrentTenantService tenant,
        IWebHostEnvironment env)
    {
        _productService = productService;
        _tenant = tenant;
        _env = env;
    }

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

    /// <summary>رفع صورة المنتج</summary>
    [HttpPost("{id:int}/image")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadImage(int id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { success = false, errors = new[] { "لم يتم اختيار ملف" } });

        if (!file.ContentType.StartsWith("image/"))
            return BadRequest(new { success = false, errors = new[] { "يجب أن يكون الملف صورة" } });

        if (file.Length > 5_000_000)
            return BadRequest(new { success = false, errors = new[] { "حجم الصورة يجب ألا يتجاوز 5 ميغابايت" } });

        var tenantId = _tenant.TenantId;
        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".jpg";
        var fileName = $"{id}_{Guid.NewGuid():N}{ext}";
        var tenantFolder = Path.Combine(_env.WebRootPath, "uploads", "products", tenantId.ToString());

        Directory.CreateDirectory(tenantFolder);

        // Delete old image if exists
        var oldResult = await _productService.GetByIdAsync(id);
        if (!oldResult.IsSuccess)
            return BadRequest(new { success = false, errors = oldResult.Errors });

        if (!string.IsNullOrEmpty(oldResult.Data?.ImageUrl))
        {
            var oldPath = Path.Combine(_env.WebRootPath, oldResult.Data.ImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        var filePath = Path.Combine(tenantFolder, fileName);
        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var imageUrl = $"/uploads/products/{tenantId}/{fileName}";
        var result = await _productService.UpdateImageAsync(id, imageUrl);
        return HandleResult(result);
    }

    /// <summary>حذف صورة المنتج</summary>
    [HttpDelete("{id:int}/image")]
    public async Task<IActionResult> DeleteImage(int id)
    {
        var existing = await _productService.GetByIdAsync(id);
        if (!existing.IsSuccess)
            return BadRequest(new { success = false, errors = existing.Errors });

        if (!string.IsNullOrEmpty(existing.Data?.ImageUrl))
        {
            var oldPath = Path.Combine(_env.WebRootPath, existing.Data.ImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        var result = await _productService.UpdateImageAsync(id, null);
        return HandleResult(result);
    }
}

// ============================================================
// CategoriesController
// ============================================================

