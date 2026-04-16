using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface ICategoryService
{
    Task<Result<CategoryDto>> CreateAsync(CreateCategoryRequest request);
    Task<Result<List<CategoryDto>>> GetAllAsync();
    Task<Result<CategoryDto>> UpdateAsync(int id, UpdateCategoryRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<int>> MoveProductsAsync(int sourceCategoryId, MoveProductsRequest request);
}

