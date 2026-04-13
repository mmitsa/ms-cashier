using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>استيراد وتصدير البيانات (CSV)</summary>
[Route("api/v1/import-export")]
[Authorize]
public class ImportExportController : BaseApiController
{
    private readonly ICsvImportService _csvService;

    public ImportExportController(ICsvImportService csvService) => _csvService = csvService;

    // ─── Import ───

    /// <summary>استيراد منتجات من ملف CSV</summary>
    /// <param name="file">ملف CSV</param>
    /// <param name="warehouseId">معرف المستودع</param>
    /// <param name="skipDuplicates">تخطي المكرر</param>
    [HttpPost("import/products")]
    public async Task<IActionResult> ImportProducts(IFormFile file, [FromQuery] int warehouseId, [FromQuery] bool skipDuplicates = true)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, errors = new[] { "يرجى اختيار ملف CSV" } });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { success = false, errors = new[] { "يجب أن يكون الملف بصيغة CSV" } });

        using var stream = file.OpenReadStream();
        var result = await _csvService.ImportProductsAsync(stream, warehouseId, skipDuplicates);
        return HandleResult(result);
    }

    /// <summary>استيراد جهات اتصال من ملف CSV</summary>
    /// <param name="file">ملف CSV</param>
    /// <param name="skipDuplicates">تخطي المكرر</param>
    [HttpPost("import/contacts")]
    public async Task<IActionResult> ImportContacts(IFormFile file, [FromQuery] bool skipDuplicates = true)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, errors = new[] { "يرجى اختيار ملف CSV" } });

        using var stream = file.OpenReadStream();
        var result = await _csvService.ImportContactsAsync(stream, skipDuplicates);
        return HandleResult(result);
    }

    /// <summary>استيراد تصنيفات من ملف CSV</summary>
    /// <param name="file">ملف CSV</param>
    /// <param name="skipDuplicates">تخطي المكرر</param>
    [HttpPost("import/categories")]
    public async Task<IActionResult> ImportCategories(IFormFile file, [FromQuery] bool skipDuplicates = true)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, errors = new[] { "يرجى اختيار ملف CSV" } });

        using var stream = file.OpenReadStream();
        var result = await _csvService.ImportCategoriesAsync(stream, skipDuplicates);
        return HandleResult(result);
    }

    // ─── Export ───

    /// <summary>تصدير المنتجات إلى ملف CSV</summary>
    /// <param name="categoryId">معرف التصنيف (اختياري)</param>
    /// <param name="activeOnly">المنتجات النشطة فقط</param>
    [HttpGet("export/products")]
    public async Task<IActionResult> ExportProducts([FromQuery] int? categoryId, [FromQuery] bool activeOnly = true)
    {
        var result = await _csvService.ExportProductsCsvAsync(categoryId, activeOnly);
        if (!result.IsSuccess) return BadRequest(new { success = false, errors = result.Errors });
        return File(result.Data!, "text/csv; charset=utf-8", $"products-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>تصدير جهات الاتصال إلى ملف CSV</summary>
    /// <param name="activeOnly">جهات الاتصال النشطة فقط</param>
    [HttpGet("export/contacts")]
    public async Task<IActionResult> ExportContacts([FromQuery] bool activeOnly = true)
    {
        var result = await _csvService.ExportContactsCsvAsync(activeOnly);
        if (!result.IsSuccess) return BadRequest(new { success = false, errors = result.Errors });
        return File(result.Data!, "text/csv; charset=utf-8", $"contacts-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>تصدير التصنيفات إلى ملف CSV</summary>
    [HttpGet("export/categories")]
    public async Task<IActionResult> ExportCategories()
    {
        var result = await _csvService.ExportCategoriesCsvAsync();
        if (!result.IsSuccess) return BadRequest(new { success = false, errors = result.Errors });
        return File(result.Data!, "text/csv; charset=utf-8", $"categories-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    // ─── Templates ───

    /// <summary>تحميل قالب CSV للاستيراد</summary>
    /// <param name="type">نوع القالب (منتجات، جهات اتصال، تصنيفات)</param>
    [HttpGet("template/{type}")]
    public IActionResult GetTemplate(CsvImportType type)
    {
        var bytes = _csvService.GetCsvTemplate(type);
        var fileName = type switch
        {
            CsvImportType.Products => "products-template.csv",
            CsvImportType.Contacts => "contacts-template.csv",
            CsvImportType.Categories => "categories-template.csv",
            _ => "template.csv",
        };
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }
}
