using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 1. AuthService
// ════════════════════════════════════════════════════════════════

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly ITokenService _tokenService;

    public AuthService(IUnitOfWork uow, ITokenService tokenService)
    {
        _uow = uow;
        _tokenService = tokenService;
    }

    public async Task<Result<LoginResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            // Fetch ALL users with this username across all tenants
            // (query filter bypassed for User when TenantId == Guid.Empty during login)
            var candidates = await _uow.Repository<User>().Query()
                .Where(u =>
                    u.Username == request.Username &&
                    !u.IsDeleted &&
                    u.IsActive)
                .ToListAsync();

            if (candidates.Count == 0)
                return Result<LoginResponse>.Failure("اسم المستخدم أو كلمة المرور غير صحيحة");

            // Try to match the password against each candidate
            User? matchedUser = null;
            foreach (var candidate in candidates)
            {
                if (BCrypt.Net.BCrypt.Verify(request.Password, candidate.PasswordHash))
                {
                    matchedUser = candidate;
                    break;
                }
            }

            if (matchedUser is null)
                return Result<LoginResponse>.Failure("اسم المستخدم أو كلمة المرور غير صحيحة");

            // CRITICAL: Verify the tenant is active (not suspended/deleted).
            // AsNoTracking ensures we re-read the row from the database every time,
            // not the EF identity-map cache. This matters for the refresh path:
            // if a user's tenant gets suspended after login, the next refresh
            // call must observe the new status, not the stale cached one.
            var tenant = await _uow.Repository<Tenant>().Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == matchedUser.TenantId);

            if (tenant is null)
                return Result<LoginResponse>.Failure("المنشأة غير موجودة");

            if (tenant.Status == TenantStatus.Suspended)
                return Result<LoginResponse>.Failure("تم إيقاف المنشأة. تواصل مع الإدارة.");

            if (tenant.Status == TenantStatus.Trial && tenant.TrialEndDate.HasValue && tenant.TrialEndDate.Value < DateTime.UtcNow)
                return Result<LoginResponse>.Failure("انتهت الفترة التجريبية. يرجى التواصل مع الإدارة لتفعيل الاشتراك.");

            if (tenant.Status == TenantStatus.Expired)
                return Result<LoginResponse>.Failure("انتهت الفترة التجريبية. يرجى التواصل مع الإدارة لتفعيل الاشتراك.");

            // Load granted permissions to embed as JWT claims (avoids per-request DB hit).
            var grantedPermissions = await _uow.Repository<UserPermission>().Query()
                .Where(p => p.UserId == matchedUser.Id && p.IsGranted)
                .Select(p => p.Permission)
                .ToListAsync();

            var accessToken = _tokenService.GenerateAccessToken(matchedUser, grantedPermissions);
            var refreshToken = _tokenService.GenerateRefreshToken();

            matchedUser.LastLoginAt = DateTime.UtcNow;
            matchedUser.RefreshToken = refreshToken;
            matchedUser.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            _uow.Repository<User>().Update(matchedUser);
            await _uow.SaveChangesAsync();

            var userDto = new UserDto(
                matchedUser.Id, matchedUser.Username, matchedUser.FullName, matchedUser.Phone,
                matchedUser.Email, matchedUser.Role, matchedUser.IsActive, matchedUser.LastLoginAt);

            return Result<LoginResponse>.Success(
                new LoginResponse(accessToken, refreshToken, userDto));
        }
        catch (Exception ex)
        {
            return Result<LoginResponse>.Failure($"خطأ أثناء تسجيل الدخول: {ex.Message}");
        }
    }

    public async Task<Result<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        try
        {
            var user = await _uow.Repository<User>().Query()
                .FirstOrDefaultAsync(u =>
                    u.RefreshToken == request.RefreshToken &&
                    !u.IsDeleted &&
                    u.IsActive);

            if (user is null)
                return Result<LoginResponse>.Failure("رمز التحديث غير صالح");

            if (user.RefreshTokenExpiry < DateTime.UtcNow)
                return Result<LoginResponse>.Failure("رمز التحديث منتهي الصلاحية");

            // CRITICAL: re-check the tenant status on every refresh.
            // Without this, a user belonging to a tenant that gets suspended
            // or whose subscription expires after they last logged in could
            // keep extending their session indefinitely with their refresh
            // token, bypassing every check the login flow performs.
            // AsNoTracking is required so we always re-read the row from the
            // database — not the EF identity-map cache from a previous request.
            var tenant = await _uow.Repository<Tenant>().Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == user.TenantId);

            if (tenant is null)
                return Result<LoginResponse>.Failure("المنشأة غير موجودة");

            if (tenant.Status == TenantStatus.Suspended)
                return Result<LoginResponse>.Failure("تم إيقاف المنشأة. تواصل مع الإدارة.");

            if (tenant.Status == TenantStatus.Trial && tenant.TrialEndDate.HasValue && tenant.TrialEndDate.Value < DateTime.UtcNow)
                return Result<LoginResponse>.Failure("انتهت الفترة التجريبية. يرجى التواصل مع الإدارة لتفعيل الاشتراك.");

            if (tenant.Status == TenantStatus.Expired)
                return Result<LoginResponse>.Failure("انتهت الفترة التجريبية. يرجى التواصل مع الإدارة لتفعيل الاشتراك.");

            // Reload permissions on refresh so revoked grants take effect within one token cycle.
            var grantedPermissions = await _uow.Repository<UserPermission>().Query()
                .Where(p => p.UserId == user.Id && p.IsGranted)
                .Select(p => p.Permission)
                .ToListAsync();

            var accessToken = _tokenService.GenerateAccessToken(user, grantedPermissions);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            _uow.Repository<User>().Update(user);
            await _uow.SaveChangesAsync();

            var userDto = new UserDto(
                user.Id, user.Username, user.FullName, user.Phone,
                user.Email, user.Role, user.IsActive, user.LastLoginAt);

            return Result<LoginResponse>.Success(
                new LoginResponse(accessToken, refreshToken, userDto));
        }
        catch (Exception ex)
        {
            return Result<LoginResponse>.Failure($"خطأ أثناء تحديث الرمز: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ChangePasswordAsync(Guid userId, string oldPassword, string newPassword)
    {
        try
        {
            var user = await _uow.Repository<User>().GetByIdAsync(userId);
            if (user is null)
                return Result<bool>.Failure("المستخدم غير موجود");

            if (!BCrypt.Net.BCrypt.Verify(oldPassword, user.PasswordHash))
                return Result<bool>.Failure("كلمة المرور الحالية غير صحيحة");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<User>().Update(user);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم تغيير كلمة المرور بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ أثناء تغيير كلمة المرور: {ex.Message}");
        }
    }
}

// ════════════════════════════════════════════════════════════════
// 2. ProductService
// ════════════════════════════════════════════════════════════════

