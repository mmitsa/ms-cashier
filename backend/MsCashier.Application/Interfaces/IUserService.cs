using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// User Management
public interface IUserService
{
    Task<Result<List<UserDetailDto>>> GetAllAsync();
    Task<Result<UserDetailDto>> CreateAsync(CreateUserRequest request);
    Task<Result<UserDetailDto>> UpdateAsync(Guid id, UpdateUserRequest request);
    Task<Result<bool>> DeleteAsync(Guid id);
    Task<Result<bool>> ToggleActiveAsync(Guid id);
    Task<Result<bool>> UpdatePermissionsAsync(Guid id, List<PermissionDto> permissions);
}

