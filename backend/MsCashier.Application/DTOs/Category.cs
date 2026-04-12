using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Category
public record CategoryDto(int Id, string Name, int? ParentId, int SortOrder, int ProductCount);
public record CreateCategoryRequest(string Name, int? ParentId, int SortOrder = 0);

