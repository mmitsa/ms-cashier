using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة التصنيفات</summary>
[Route("api/v1/categories")]
public class CategoriesController : BaseApiController
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService) => _categoryService = categoryService;

    /// <summary>إنشاء تصنيف جديد</summary>
    /// <param name="request">بيانات التصنيف</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        var result = await _categoryService.CreateAsync(request);
        return HandleResult(result);
    }

    /// <summary>عرض جميع التصنيفات</summary>
    [HttpGet]
    [ResponseCache(Duration = 30)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _categoryService.GetAllAsync();
        return HandleResult(result);
    }

    /// <summary>حذف تصنيف</summary>
    /// <param name="id">معرف التصنيف</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _categoryService.DeleteAsync(id);
        return HandleResult(result);
    }
}

// ============================================================
// InvoicesController
// ============================================================

