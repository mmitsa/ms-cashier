using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// RecipeService
// ════════════════════════════════════════════════════════════════

public class RecipeService : IRecipeService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public RecipeService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<RecipeDto>> CreateAsync(CreateRecipeRequest request)
    {
        try
        {
            var recipeType = Enum.Parse<RecipeType>(request.RecipeType);
            var code = $"RCP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

            var recipe = new Recipe
            {
                Code = code,
                Name = request.Name,
                Description = request.Description,
                RecipeType = recipeType,
                Status = RecipeStatus.Draft,
                ProductId = request.ProductId,
                CategoryId = request.CategoryId,
                YieldQuantity = request.YieldQuantity,
                YieldUnitId = request.YieldUnitId,
                PreparationTimeMinutes = request.PreparationTimeMinutes,
                CookingTimeMinutes = request.CookingTimeMinutes,
                ShelfLifeHours = request.ShelfLifeHours,
                StorageInstructions = request.StorageInstructions,
                Instructions = request.Instructions,
                TargetFoodCostPercent = request.TargetFoodCostPercent,
                BranchId = request.BranchId,
                CreatedBy = _tenant.UserId
            };

            await _uow.Repository<Recipe>().AddAsync(recipe);
            await _uow.SaveChangesAsync();

            // Add ingredients
            if (request.Ingredients?.Any() == true)
            {
                foreach (var ing in request.Ingredients)
                {
                    var ingredientType = Enum.Parse<IngredientType>(ing.IngredientType);
                    var ingredient = new RecipeIngredient
                    {
                        TenantId = _tenant.TenantId,
                        RecipeId = recipe.Id,
                        IngredientType = ingredientType,
                        RawMaterialId = ingredientType == IngredientType.RawMaterial ? ing.RawMaterialId : null,
                        SubRecipeId = ingredientType == IngredientType.SemiFinishedRecipe ? ing.SubRecipeId : null,
                        Quantity = ing.Quantity,
                        UnitId = ing.UnitId,
                        WastePercent = ing.WastePercent,
                        SortOrder = ing.SortOrder,
                        IsOptional = ing.IsOptional,
                        Notes = ing.Notes
                    };
                    await _uow.Repository<RecipeIngredient>().AddAsync(ingredient);
                }
                await _uow.SaveChangesAsync();
            }

            return await GetByIdAsync(recipe.Id);
        }
        catch (Exception ex) { return Result<RecipeDto>.Failure($"خطأ في إنشاء الوصفة: {ex.Message}"); }
    }

    public async Task<Result<RecipeDto>> GetByIdAsync(int id)
    {
        try
        {
            var recipe = await _uow.Repository<Recipe>().Query()
                .Include(r => r.Product)
                .Include(r => r.Category)
                .Include(r => r.YieldUnit)
                .Include(r => r.Ingredients).ThenInclude(i => i.RawMaterial)
                .Include(r => r.Ingredients).ThenInclude(i => i.SubRecipe)
                .Include(r => r.Ingredients).ThenInclude(i => i.Unit)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (recipe == null) return Result<RecipeDto>.Failure("الوصفة غير موجودة");

            return Result<RecipeDto>.Success(MapRecipeToDto(recipe));
        }
        catch (Exception ex) { return Result<RecipeDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PagedResult<RecipeDto>>> SearchAsync(RecipeSearchRequest request)
    {
        try
        {
            var query = _uow.Repository<Recipe>().Query()
                .Include(r => r.Product)
                .Include(r => r.Category)
                .Include(r => r.YieldUnit)
                .Include(r => r.Ingredients)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.SearchTerm))
                query = query.Where(r => r.Name.Contains(request.SearchTerm) || r.Code.Contains(request.SearchTerm));
            if (!string.IsNullOrEmpty(request.RecipeType))
                query = query.Where(r => r.RecipeType == Enum.Parse<RecipeType>(request.RecipeType));
            if (!string.IsNullOrEmpty(request.Status))
                query = query.Where(r => r.Status == Enum.Parse<RecipeStatus>(request.Status));
            if (request.CategoryId.HasValue)
                query = query.Where(r => r.CategoryId == request.CategoryId);
            if (request.ProductId.HasValue)
                query = query.Where(r => r.ProductId == request.ProductId);

            var total = await query.CountAsync();
            var items = await query.OrderByDescending(r => r.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var dtos = items.Select(MapRecipeToDto).ToList();
            return Result<PagedResult<RecipeDto>>.Success(
                new PagedResult<RecipeDto> { Items = dtos, TotalCount = total, PageNumber = request.Page, PageSize = request.PageSize });
        }
        catch (Exception ex) { return Result<PagedResult<RecipeDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<RecipeDto>> UpdateAsync(int id, UpdateRecipeRequest request)
    {
        try
        {
            var recipe = await _uow.Repository<Recipe>().Query()
                .Include(r => r.Ingredients)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (recipe == null) return Result<RecipeDto>.Failure("الوصفة غير موجودة");
            if (recipe.Status == RecipeStatus.Active)
                return Result<RecipeDto>.Failure("لا يمكن تعديل وصفة مفعّلة. أنشئ نسخة جديدة.");

            if (request.Name != null) recipe.Name = request.Name;
            if (request.Description != null) recipe.Description = request.Description;
            if (request.ProductId.HasValue) recipe.ProductId = request.ProductId;
            if (request.CategoryId.HasValue) recipe.CategoryId = request.CategoryId;
            if (request.YieldQuantity.HasValue) recipe.YieldQuantity = request.YieldQuantity.Value;
            if (request.YieldUnitId.HasValue) recipe.YieldUnitId = request.YieldUnitId;
            if (request.PreparationTimeMinutes.HasValue) recipe.PreparationTimeMinutes = request.PreparationTimeMinutes.Value;
            if (request.CookingTimeMinutes.HasValue) recipe.CookingTimeMinutes = request.CookingTimeMinutes.Value;
            if (request.ShelfLifeHours.HasValue) recipe.ShelfLifeHours = request.ShelfLifeHours;
            if (request.StorageInstructions != null) recipe.StorageInstructions = request.StorageInstructions;
            if (request.Instructions != null) recipe.Instructions = request.Instructions;
            if (request.TargetFoodCostPercent.HasValue) recipe.TargetFoodCostPercent = request.TargetFoodCostPercent;

            if (request.Ingredients != null)
            {
                foreach (var old in recipe.Ingredients.ToList())
                    _uow.Repository<RecipeIngredient>().Remove(old);

                foreach (var ing in request.Ingredients)
                {
                    var ingredientType = Enum.Parse<IngredientType>(ing.IngredientType);
                    await _uow.Repository<RecipeIngredient>().AddAsync(new RecipeIngredient
                    {
                        TenantId = _tenant.TenantId,
                        RecipeId = recipe.Id,
                        IngredientType = ingredientType,
                        RawMaterialId = ingredientType == IngredientType.RawMaterial ? ing.RawMaterialId : null,
                        SubRecipeId = ingredientType == IngredientType.SemiFinishedRecipe ? ing.SubRecipeId : null,
                        Quantity = ing.Quantity,
                        UnitId = ing.UnitId,
                        WastePercent = ing.WastePercent,
                        SortOrder = ing.SortOrder,
                        IsOptional = ing.IsOptional,
                        Notes = ing.Notes
                    });
                }
            }

            _uow.Repository<Recipe>().Update(recipe);
            await _uow.SaveChangesAsync();
            return await GetByIdAsync(id);
        }
        catch (Exception ex) { return Result<RecipeDto>.Failure($"خطأ في تحديث الوصفة: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var recipe = await _uow.Repository<Recipe>().GetByIdAsync(id);
            if (recipe == null) return Result<bool>.Failure("الوصفة غير موجودة");
            recipe.IsDeleted = true;
            _uow.Repository<Recipe>().Update(recipe);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف الوصفة");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<RecipeDto>> ActivateAsync(int id)
    {
        try
        {
            var recipe = await _uow.Repository<Recipe>().Query()
                .Include(r => r.Ingredients)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (recipe == null) return Result<RecipeDto>.Failure("الوصفة غير موجودة");
            if (!recipe.Ingredients.Any()) return Result<RecipeDto>.Failure("لا يمكن تفعيل وصفة بدون مكونات");

            // Deactivate other versions
            if (recipe.ParentRecipeId.HasValue || recipe.Version == 1)
            {
                var rootId = recipe.ParentRecipeId ?? recipe.Id;
                var siblings = await _uow.Repository<Recipe>().Query()
                    .Where(r => (r.ParentRecipeId == rootId || r.Id == rootId) && r.Id != id && r.IsCurrentVersion)
                    .ToListAsync();
                foreach (var s in siblings)
                {
                    s.IsCurrentVersion = false;
                    s.Status = RecipeStatus.Archived;
                    _uow.Repository<Recipe>().Update(s);
                }
            }

            recipe.Status = RecipeStatus.Active;
            recipe.IsCurrentVersion = true;
            _uow.Repository<Recipe>().Update(recipe);
            await _uow.SaveChangesAsync();
            return await GetByIdAsync(id);
        }
        catch (Exception ex) { return Result<RecipeDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<RecipeDto>> NewVersionAsync(int id)
    {
        try
        {
            var original = await _uow.Repository<Recipe>().Query()
                .Include(r => r.Ingredients)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (original == null) return Result<RecipeDto>.Failure("الوصفة غير موجودة");

            var rootId = original.ParentRecipeId ?? original.Id;
            var maxVersion = await _uow.Repository<Recipe>().Query()
                .Where(r => r.ParentRecipeId == rootId || r.Id == rootId)
                .MaxAsync(r => r.Version);

            var newRecipe = new Recipe
            {
                Code = original.Code,
                Name = original.Name,
                Description = original.Description,
                RecipeType = original.RecipeType,
                Status = RecipeStatus.Draft,
                ProductId = original.ProductId,
                CategoryId = original.CategoryId,
                YieldQuantity = original.YieldQuantity,
                YieldUnitId = original.YieldUnitId,
                PreparationTimeMinutes = original.PreparationTimeMinutes,
                CookingTimeMinutes = original.CookingTimeMinutes,
                ShelfLifeHours = original.ShelfLifeHours,
                StorageInstructions = original.StorageInstructions,
                Instructions = original.Instructions,
                TargetFoodCostPercent = original.TargetFoodCostPercent,
                BranchId = original.BranchId,
                Version = maxVersion + 1,
                IsCurrentVersion = false,
                ParentRecipeId = rootId,
                CreatedBy = _tenant.UserId
            };

            // Generate new unique code for the version
            newRecipe.Code = $"{original.Code}-v{newRecipe.Version}";

            await _uow.Repository<Recipe>().AddAsync(newRecipe);
            await _uow.SaveChangesAsync();

            foreach (var ing in original.Ingredients)
            {
                await _uow.Repository<RecipeIngredient>().AddAsync(new RecipeIngredient
                {
                    TenantId = _tenant.TenantId,
                    RecipeId = newRecipe.Id,
                    IngredientType = ing.IngredientType,
                    RawMaterialId = ing.RawMaterialId,
                    SubRecipeId = ing.SubRecipeId,
                    Quantity = ing.Quantity,
                    UnitId = ing.UnitId,
                    WastePercent = ing.WastePercent,
                    SortOrder = ing.SortOrder,
                    IsOptional = ing.IsOptional,
                    Notes = ing.Notes
                });
            }
            await _uow.SaveChangesAsync();

            return await GetByIdAsync(newRecipe.Id);
        }
        catch (Exception ex) { return Result<RecipeDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<RecipeCostSummaryDto>> CalculateCostAsync(int id)
    {
        try
        {
            var recipe = await _uow.Repository<Recipe>().Query()
                .Include(r => r.Product)
                .Include(r => r.Ingredients).ThenInclude(i => i.RawMaterial)
                .Include(r => r.Ingredients).ThenInclude(i => i.SubRecipe)
                .Include(r => r.Ingredients).ThenInclude(i => i.Unit)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (recipe == null) return Result<RecipeCostSummaryDto>.Failure("الوصفة غير موجودة");

            decimal totalCost = 0;
            var ingredientCosts = new List<RecipeIngredientCostDto>();

            foreach (var ing in recipe.Ingredients.OrderBy(i => i.SortOrder))
            {
                decimal unitCost = 0;
                string ingredientName;

                if (ing.IngredientType == IngredientType.RawMaterial && ing.RawMaterial != null)
                {
                    unitCost = ing.RawMaterial.CostPrice;
                    ingredientName = ing.RawMaterial.Name;
                }
                else if (ing.SubRecipe != null)
                {
                    // Recursive cost calculation for sub-recipes
                    var subResult = await CalculateCostAsync(ing.SubRecipeId!.Value);
                    if (subResult.IsSuccess)
                        unitCost = subResult.Data!.CostPerPortion;
                    ingredientName = ing.SubRecipe.Name;
                }
                else
                {
                    ingredientName = "غير محدد";
                }

                var grossQty = ing.WastePercent > 0 ? ing.Quantity / (1 - ing.WastePercent / 100) : ing.Quantity;
                var lineCost = grossQty * unitCost;
                totalCost += lineCost;

                // Update ingredient cost in DB
                ing.UnitCost = unitCost;
                ing.TotalCost = lineCost;
                _uow.Repository<RecipeIngredient>().Update(ing);

                ingredientCosts.Add(new RecipeIngredientCostDto(
                    ingredientName, ing.Quantity, ing.Unit?.Name,
                    ing.WastePercent, grossQty, unitCost, lineCost, 0));
            }

            var costPerPortion = recipe.YieldQuantity > 0 ? totalCost / recipe.YieldQuantity : totalCost;
            var sellingPrice = recipe.Product?.RetailPrice ?? 0;
            var foodCostPercent = sellingPrice > 0 ? (costPerPortion / sellingPrice) * 100 : 0;

            // Update percentages in ingredient costs
            ingredientCosts = ingredientCosts.Select(ic =>
                ic with { CostPercent = totalCost > 0 ? (ic.TotalCost / totalCost) * 100 : 0 }).ToList();

            // Persist calculated cost
            recipe.CalculatedCost = costPerPortion;
            recipe.CalculatedFoodCostPercent = foodCostPercent;
            recipe.LastCostCalculationAt = DateTime.UtcNow;
            _uow.Repository<Recipe>().Update(recipe);
            await _uow.SaveChangesAsync();

            return Result<RecipeCostSummaryDto>.Success(new RecipeCostSummaryDto(
                recipe.Id, recipe.Name, totalCost, costPerPortion,
                sellingPrice, foodCostPercent, recipe.TargetFoodCostPercent,
                recipe.TargetFoodCostPercent.HasValue && foodCostPercent > recipe.TargetFoodCostPercent.Value,
                ingredientCosts));
        }
        catch (Exception ex) { return Result<RecipeCostSummaryDto>.Failure($"خطأ في حساب التكلفة: {ex.Message}"); }
    }

    public async Task<Result<bool>> RecalculateAllCostsAsync()
    {
        try
        {
            var activeRecipes = await _uow.Repository<Recipe>().Query()
                .Where(r => r.Status == RecipeStatus.Active)
                .Select(r => r.Id)
                .ToListAsync();

            foreach (var recipeId in activeRecipes)
                await CalculateCostAsync(recipeId);

            return Result<bool>.Success(true, $"تم إعادة حساب تكلفة {activeRecipes.Count} وصفة");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<List<RecipeDto>>> GetByProductAsync(int productId)
    {
        try
        {
            var recipes = await _uow.Repository<Recipe>().Query()
                .Include(r => r.Product).Include(r => r.Category).Include(r => r.YieldUnit)
                .Include(r => r.Ingredients).ThenInclude(i => i.RawMaterial)
                .Include(r => r.Ingredients).ThenInclude(i => i.Unit)
                .Where(r => r.ProductId == productId && r.IsCurrentVersion)
                .ToListAsync();
            return Result<List<RecipeDto>>.Success(recipes.Select(MapRecipeToDto).ToList());
        }
        catch (Exception ex) { return Result<List<RecipeDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    private static RecipeDto MapRecipeToDto(Recipe r) => new(
        r.Id, r.Code, r.Name, r.Description,
        r.RecipeType.ToString(), r.Status.ToString(),
        r.ProductId, r.Product?.Name, r.CategoryId, r.Category?.Name,
        r.YieldQuantity, r.YieldUnitId, r.YieldUnit?.Name,
        r.PreparationTimeMinutes, r.CookingTimeMinutes,
        r.ShelfLifeHours, r.StorageInstructions, r.Instructions,
        r.Version, r.IsCurrentVersion,
        r.TargetFoodCostPercent, r.CalculatedCost,
        r.CalculatedFoodCostPercent, r.LastCostCalculationAt,
        r.BranchId, r.CreatedAt,
        r.Ingredients.OrderBy(i => i.SortOrder).Select(i => new RecipeIngredientDto(
            i.Id, i.IngredientType.ToString(),
            i.RawMaterialId, i.RawMaterial?.Name,
            i.SubRecipeId, i.SubRecipe?.Name,
            i.Quantity, i.UnitId, i.Unit?.Name,
            i.WastePercent, i.GrossQuantity,
            i.UnitCost, i.TotalCost,
            i.SortOrder, i.IsOptional, i.Notes)).ToList());
}

// ════════════════════════════════════════════════════════════════
// KitchenStationService
// ════════════════════════════════════════════════════════════════

