using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Recipe Management
// ============================================================

public interface IRecipeService
{
    Task<Result<RecipeDto>> CreateAsync(CreateRecipeRequest request);
    Task<Result<RecipeDto>> GetByIdAsync(int id);
    Task<Result<PagedResult<RecipeDto>>> SearchAsync(RecipeSearchRequest request);
    Task<Result<RecipeDto>> UpdateAsync(int id, UpdateRecipeRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<RecipeDto>> ActivateAsync(int id);
    Task<Result<RecipeDto>> NewVersionAsync(int id);
    Task<Result<RecipeCostSummaryDto>> CalculateCostAsync(int id);
    Task<Result<bool>> RecalculateAllCostsAsync();
    Task<Result<List<RecipeDto>>> GetByProductAsync(int productId);
}

// ============================================================
// Kitchen Station Management
// ============================================================

