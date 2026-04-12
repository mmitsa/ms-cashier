using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/recipes")]
public class RecipesController : BaseApiController
{
    private readonly IRecipeService _recipeService;
    public RecipesController(IRecipeService recipeService) => _recipeService = recipeService;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRecipeRequest request)
        => HandleResult(await _recipeService.CreateAsync(request));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _recipeService.GetByIdAsync(id));

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] RecipeSearchRequest request)
        => HandleResult(await _recipeService.SearchAsync(request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRecipeRequest request)
        => HandleResult(await _recipeService.UpdateAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _recipeService.DeleteAsync(id));

    [HttpPost("{id:int}/activate")]
    public async Task<IActionResult> Activate(int id)
        => HandleResult(await _recipeService.ActivateAsync(id));

    [HttpPost("{id:int}/new-version")]
    public async Task<IActionResult> NewVersion(int id)
        => HandleResult(await _recipeService.NewVersionAsync(id));

    [HttpGet("{id:int}/cost")]
    public async Task<IActionResult> CalculateCost(int id)
        => HandleResult(await _recipeService.CalculateCostAsync(id));

    [HttpPost("recalculate-all")]
    public async Task<IActionResult> RecalculateAll()
        => HandleResult(await _recipeService.RecalculateAllCostsAsync());

    [HttpGet("by-product/{productId:int}")]
    public async Task<IActionResult> GetByProduct(int productId)
        => HandleResult(await _recipeService.GetByProductAsync(productId));
}

// ============================================================
// KitchenStationsController
// ============================================================

