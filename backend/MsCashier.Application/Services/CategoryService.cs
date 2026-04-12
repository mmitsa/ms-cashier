using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 5. CategoryService
// ════════════════════════════════════════════════════════════════

public class CategoryService : ICategoryService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public CategoryService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<CategoryDto>> CreateAsync(CreateCategoryRequest request)
    {
        try
        {
            var exists = await _uow.Repository<Category>().AnyAsync(c =>
                c.TenantId == _tenant.TenantId &&
                c.Name == request.Name &&
                !c.IsDeleted);

            if (exists)
                return Result<CategoryDto>.Failure("التصنيف موجود بالفعل");

            var category = new Category
            {
                TenantId = _tenant.TenantId,
                Name = request.Name,
                ParentId = request.ParentId,
                SortOrder = request.SortOrder,
                IsActive = true
            };

            await _uow.Repository<Category>().AddAsync(category);
            await _uow.SaveChangesAsync();

            return Result<CategoryDto>.Success(
                new CategoryDto(category.Id, category.Name, category.ParentId, category.SortOrder, 0),
                "تم إنشاء التصنيف بنجاح");
        }
        catch (Exception ex)
        {
            return Result<CategoryDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<List<CategoryDto>>> GetAllAsync()
    {
        try
        {
            var categories = await _uow.Repository<Category>().Query()
                .Where(c => c.TenantId == _tenant.TenantId && !c.IsDeleted)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();

            var categoryIds = categories.Select(c => c.Id).ToList();

            var productCounts = await _uow.Repository<Product>().Query()
                .Where(p =>
                    p.TenantId == _tenant.TenantId &&
                    !p.IsDeleted &&
                    p.CategoryId.HasValue &&
                    categoryIds.Contains(p.CategoryId.Value))
                .GroupBy(p => p.CategoryId!.Value)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

            var dtos = categories.Select(c => new CategoryDto(
                c.Id, c.Name, c.ParentId, c.SortOrder,
                productCounts.ContainsKey(c.Id) ? productCounts[c.Id] : 0
            )).ToList();

            return Result<List<CategoryDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<CategoryDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var category = await _uow.Repository<Category>().Query()
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.TenantId == _tenant.TenantId &&
                    !c.IsDeleted);

            if (category is null)
                return Result<bool>.Failure("التصنيف غير موجود");

            var hasProducts = await _uow.Repository<Product>().AnyAsync(p =>
                p.CategoryId == id &&
                p.TenantId == _tenant.TenantId &&
                !p.IsDeleted);

            if (hasProducts)
                return Result<bool>.Failure("لا يمكن حذف التصنيف لأنه يحتوي على منتجات");

            var hasChildren = await _uow.Repository<Category>().AnyAsync(c =>
                c.ParentId == id &&
                c.TenantId == _tenant.TenantId &&
                !c.IsDeleted);

            if (hasChildren)
                return Result<bool>.Failure("لا يمكن حذف التصنيف لأنه يحتوي على تصنيفات فرعية");

            category.IsDeleted = true;
            category.IsActive = false;
            category.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<Category>().Update(category);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم حذف التصنيف بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }
}

// ════════════════════════════════════════════════════════════════
// 6. WarehouseService
// ════════════════════════════════════════════════════════════════

