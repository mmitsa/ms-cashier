using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة الوصفات (التصنيع)</summary>
[Route("api/v1/recipes")]
public class RecipesController : BaseApiController
{
    private readonly IRecipeService _recipeService;
    public RecipesController(IRecipeService recipeService) => _recipeService = recipeService;

    /// <summary>إنشاء وصفة جديدة</summary>
    /// <param name="request">بيانات الوصفة</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRecipeRequest request)
        => HandleResult(await _recipeService.CreateAsync(request));

    /// <summary>عرض وصفة بالمعرف</summary>
    /// <param name="id">معرف الوصفة</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _recipeService.GetByIdAsync(id));

    /// <summary>البحث في الوصفات</summary>
    /// <param name="request">معايير البحث</param>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] RecipeSearchRequest request)
        => HandleResult(await _recipeService.SearchAsync(request));

    /// <summary>تحديث وصفة</summary>
    /// <param name="id">معرف الوصفة</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRecipeRequest request)
        => HandleResult(await _recipeService.UpdateAsync(id, request));

    /// <summary>حذف وصفة</summary>
    /// <param name="id">معرف الوصفة</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _recipeService.DeleteAsync(id));

    /// <summary>تفعيل وصفة</summary>
    /// <param name="id">معرف الوصفة</param>
    [HttpPost("{id:int}/activate")]
    public async Task<IActionResult> Activate(int id)
        => HandleResult(await _recipeService.ActivateAsync(id));

    /// <summary>إنشاء نسخة جديدة من الوصفة</summary>
    /// <param name="id">معرف الوصفة</param>
    [HttpPost("{id:int}/new-version")]
    public async Task<IActionResult> NewVersion(int id)
        => HandleResult(await _recipeService.NewVersionAsync(id));

    /// <summary>حساب تكلفة الوصفة</summary>
    /// <param name="id">معرف الوصفة</param>
    [HttpGet("{id:int}/cost")]
    public async Task<IActionResult> CalculateCost(int id)
        => HandleResult(await _recipeService.CalculateCostAsync(id));

    /// <summary>إعادة حساب تكاليف جميع الوصفات</summary>
    [HttpPost("recalculate-all")]
    public async Task<IActionResult> RecalculateAll()
        => HandleResult(await _recipeService.RecalculateAllCostsAsync());

    /// <summary>عرض وصفات منتج محدد</summary>
    /// <param name="productId">معرف المنتج</param>
    [HttpGet("by-product/{productId:int}")]
    public async Task<IActionResult> GetByProduct(int productId)
        => HandleResult(await _recipeService.GetByProductAsync(productId));
}

// ============================================================
// KitchenStationsController
// ============================================================
