using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// UserService
// ════════════════════════════════════════════════════════════════

public class UserService : IUserService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public UserService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<List<UserDetailDto>>> GetAllAsync()
    {
        try
        {
            var users = await _uow.Repository<User>().Query()
                .Where(u => u.TenantId == _tenant.TenantId && !u.IsDeleted)
                .Include(u => u.Permissions)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var dtos = users.Select(MapToDetailDto).ToList();
            return Result<List<UserDetailDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<UserDetailDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<UserDetailDto>> CreateAsync(CreateUserRequest request)
    {
        try
        {
            var exists = await _uow.Repository<User>().AnyAsync(
                u => u.TenantId == _tenant.TenantId && u.Username == request.Username && !u.IsDeleted);

            if (exists)
                return Result<UserDetailDto>.Failure("اسم المستخدم موجود بالفعل");

            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = _tenant.TenantId,
                Username = request.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName,
                Phone = request.Phone,
                Email = request.Email,
                Role = request.Role,
                IsActive = true
            };

            await _uow.Repository<User>().AddAsync(user);

            if (request.Permissions is { Count: > 0 })
            {
                var permissions = request.Permissions.Select(p => new UserPermission
                {
                    UserId = user.Id,
                    Permission = p,
                    IsGranted = true
                });
                await _uow.Repository<UserPermission>().AddRangeAsync(permissions);
            }

            await _uow.SaveChangesAsync();

            // Re-fetch with permissions
            var created = await _uow.Repository<User>().Query()
                .Include(u => u.Permissions)
                .FirstOrDefaultAsync(u => u.Id == user.Id);

            return Result<UserDetailDto>.Success(MapToDetailDto(created!), "تم إنشاء المستخدم بنجاح");
        }
        catch (Exception ex)
        {
            return Result<UserDetailDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<UserDetailDto>> UpdateAsync(Guid id, UpdateUserRequest request)
    {
        try
        {
            var user = await _uow.Repository<User>().Query()
                .Include(u => u.Permissions)
                .FirstOrDefaultAsync(u => u.Id == id && u.TenantId == _tenant.TenantId && !u.IsDeleted);

            if (user is null)
                return Result<UserDetailDto>.Failure("المستخدم غير موجود");

            if (request.FullName is not null) user.FullName = request.FullName;
            if (request.Phone is not null) user.Phone = request.Phone;
            if (request.Email is not null) user.Email = request.Email;
            if (request.Role is not null) user.Role = request.Role;
            if (request.Password is not null) user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            user.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<User>().Update(user);
            await _uow.SaveChangesAsync();

            return Result<UserDetailDto>.Success(MapToDetailDto(user), "تم تحديث المستخدم بنجاح");
        }
        catch (Exception ex)
        {
            return Result<UserDetailDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAsync(Guid id)
    {
        try
        {
            var user = await _uow.Repository<User>().FirstOrDefaultAsync(
                u => u.Id == id && u.TenantId == _tenant.TenantId && !u.IsDeleted);

            if (user is null)
                return Result<bool>.Failure("المستخدم غير موجود");

            user.IsDeleted = true;
            user.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<User>().Update(user);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم حذف المستخدم بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ToggleActiveAsync(Guid id)
    {
        try
        {
            var user = await _uow.Repository<User>().FirstOrDefaultAsync(
                u => u.Id == id && u.TenantId == _tenant.TenantId && !u.IsDeleted);

            if (user is null)
                return Result<bool>.Failure("المستخدم غير موجود");

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<User>().Update(user);
            await _uow.SaveChangesAsync();

            var msg = user.IsActive ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم";
            return Result<bool>.Success(true, msg);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> UpdatePermissionsAsync(Guid id, List<PermissionDto> permissions)
    {
        try
        {
            var user = await _uow.Repository<User>().Query()
                .Include(u => u.Permissions)
                .FirstOrDefaultAsync(u => u.Id == id && u.TenantId == _tenant.TenantId && !u.IsDeleted);

            if (user is null)
                return Result<bool>.Failure("المستخدم غير موجود");

            // Remove existing permissions
            foreach (var existing in user.Permissions.ToList())
            {
                _uow.Repository<UserPermission>().Remove(existing);
            }

            // Add new permissions
            var newPermissions = permissions.Select(p => new UserPermission
            {
                UserId = user.Id,
                Permission = p.Permission,
                IsGranted = p.IsGranted
            });
            await _uow.Repository<UserPermission>().AddRangeAsync(newPermissions);

            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم تحديث الصلاحيات بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    private static UserDetailDto MapToDetailDto(User u) =>
        new(u.Id, u.Username, u.FullName, u.Phone, u.Email, u.Role, u.IsActive, u.LastLoginAt,
            u.Permissions.Select(p => new PermissionDto(p.Permission, p.IsGranted)).ToList());
}

// ════════════════════════════════════════════════════════════════
// SubscriptionService
// ════════════════════════════════════════════════════════════════

