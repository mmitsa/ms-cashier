using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// TenantService
// ════════════════════════════════════════════════════════════════

public class TenantService : ITenantService
{
    private readonly IUnitOfWork _uow;

    public TenantService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<TenantDto>> CreateTenantAsync(CreateTenantRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.VatNumber))
                return Result<TenantDto>.Failure("الرقم الضريبي مطلوب");

            if (string.IsNullOrWhiteSpace(request.AdminUsername) || request.AdminUsername.Length < 3)
                return Result<TenantDto>.Failure("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");

            if (string.IsNullOrWhiteSpace(request.AdminPassword) || request.AdminPassword.Length < 6)
                return Result<TenantDto>.Failure("كلمة المرور يجب أن تكون 6 أحرف على الأقل");

            // Check username uniqueness across ALL tenants (unfiltered)
            var usernameExists = await _uow.Repository<User>().QueryUnfiltered()
                .AnyAsync(u => u.Username == request.AdminUsername && !u.IsDeleted);

            if (usernameExists)
                return Result<TenantDto>.Failure("اسم المستخدم مستخدم بالفعل. اختر اسم مستخدم آخر.");

            var plan = await _uow.Repository<Plan>().Query()
                .FirstOrDefaultAsync(p => p.Id == request.PlanId);

            if (plan is null)
                return Result<TenantDto>.Failure("الباقة غير موجودة");

            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                BusinessType = request.BusinessType,
                OwnerName = request.OwnerName,
                Phone = request.Phone,
                Email = request.Email,
                Address = request.Address,
                City = request.City,
                PlanId = request.PlanId,
                Status = TenantStatus.Active,
                SubscriptionStart = DateTime.UtcNow,
                VatNumber = request.VatNumber,
                MaxUsers = plan.MaxUsers,
                MaxWarehouses = plan.MaxWarehouses,
                MaxPosStations = plan.MaxPosStations
            };

            await _uow.Repository<Tenant>().AddAsync(tenant);

            // Create admin user for the tenant
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Username = request.AdminUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword),
                FullName = request.AdminFullName,
                Role = "Admin",
                IsActive = true
            };
            await _uow.Repository<User>().AddAsync(adminUser);

            // Create default warehouse for the tenant
            var defaultWarehouse = new Warehouse
            {
                TenantId = tenant.Id,
                Name = "المستودع الرئيسي",
                Location = request.City,
                IsMain = true,
                IsActive = true
            };
            await _uow.Repository<Warehouse>().AddAsync(defaultWarehouse);

            // Create default finance account (cash)
            var defaultAccount = new FinanceAccount
            {
                TenantId = tenant.Id,
                Name = "الصندوق النقدي",
                AccountType = AccountType.Cash,
                Balance = 0,
                IsActive = true
            };
            await _uow.Repository<FinanceAccount>().AddAsync(defaultAccount);

            await _uow.SaveChangesAsync();

            return Result<TenantDto>.Success(MapToDto(tenant, plan.Name, 1, 0, 0m));
        }
        catch (Exception ex)
        {
            return Result<TenantDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<TenantDto>>> GetAllTenantsAsync(int page, int pageSize)
    {
        try
        {
            // SuperAdmin needs unfiltered access to ALL tenants
            var query = _uow.Repository<Tenant>().Query()
                .Include(t => t.Plan);

            var totalCount = await query.CountAsync();

            var tenants = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var tenantIds = tenants.Select(t => t.Id).ToList();

            // Use QueryUnfiltered to count users/products across all tenants
            var userCounts = await _uow.Repository<User>().QueryUnfiltered()
                .Where(u => tenantIds.Contains(u.TenantId) && u.IsActive && !u.IsDeleted)
                .GroupBy(u => u.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TenantId, x => x.Count);

            var productCounts = await _uow.Repository<Product>().QueryUnfiltered()
                .Where(p => tenantIds.Contains(p.TenantId) && !p.IsDeleted)
                .GroupBy(p => p.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TenantId, x => x.Count);

            var dtos = tenants.Select(t => MapToDto(
                t,
                t.Plan?.Name ?? "",
                userCounts.GetValueOrDefault(t.Id, 0),
                productCounts.GetValueOrDefault(t.Id, 0),
                0m
            )).ToList();

            var result = new PagedResult<TenantDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };

            return Result<PagedResult<TenantDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<TenantDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<TenantDto>> GetTenantAsync(Guid id)
    {
        try
        {
            var tenant = await _uow.Repository<Tenant>().Query()
                .Include(t => t.Plan)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant is null)
                return Result<TenantDto>.Failure("المنشأة غير موجودة");

            // Use QueryUnfiltered for cross-tenant counts
            var activeUsers = await _uow.Repository<User>().QueryUnfiltered()
                .CountAsync(u => u.TenantId == id && u.IsActive && !u.IsDeleted);

            var totalProducts = await _uow.Repository<Product>().QueryUnfiltered()
                .CountAsync(p => p.TenantId == id && !p.IsDeleted);

            return Result<TenantDto>.Success(MapToDto(tenant, tenant.Plan?.Name ?? "", activeUsers, totalProducts, 0m));
        }
        catch (Exception ex)
        {
            return Result<TenantDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<TenantDto>> UpdateTenantAsync(Guid id, UpdateTenantRequest request)
    {
        try
        {
            var tenant = await _uow.Repository<Tenant>().Query()
                .Include(t => t.Plan)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant is null)
                return Result<TenantDto>.Failure("المنشأة غير موجودة");

            if (request.Name is not null) tenant.Name = request.Name;
            if (request.Phone is not null) tenant.Phone = request.Phone;
            if (request.Email is not null) tenant.Email = request.Email;
            if (request.Address is not null) tenant.Address = request.Address;
            if (request.LogoUrl is not null) tenant.LogoUrl = request.LogoUrl;
            if (request.TaxNumber is not null) tenant.TaxNumber = request.TaxNumber;
            if (request.VatNumber is not null) tenant.VatNumber = request.VatNumber;
            if (request.ZatcaEnabled.HasValue) tenant.ZatcaEnabled = request.ZatcaEnabled.Value;
            if (request.Settings is not null) tenant.Settings = request.Settings;

            _uow.Repository<Tenant>().Update(tenant);
            await _uow.SaveChangesAsync();

            return Result<TenantDto>.Success(MapToDto(tenant, tenant.Plan?.Name ?? "", 0, 0, 0m));
        }
        catch (Exception ex)
        {
            return Result<TenantDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> SuspendTenantAsync(Guid id)
    {
        try
        {
            var tenant = await _uow.Repository<Tenant>().Query()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant is null)
                return Result<bool>.Failure("المنشأة غير موجودة");

            tenant.Status = TenantStatus.Suspended;
            _uow.Repository<Tenant>().Update(tenant);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم إيقاف المنشأة");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ActivateTenantAsync(Guid id)
    {
        try
        {
            var tenant = await _uow.Repository<Tenant>().Query()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant is null)
                return Result<bool>.Failure("المنشأة غير موجودة");

            tenant.Status = TenantStatus.Active;
            _uow.Repository<Tenant>().Update(tenant);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم تفعيل المنشأة");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    private static TenantDto MapToDto(Tenant t, string planName, int activeUsers, int totalProducts, decimal totalSales) =>
        new(t.Id, t.Name, t.BusinessType ?? "", t.OwnerName, t.Phone, t.Email, t.Address, t.City,
            t.LogoUrl, t.PlanId, planName, t.Status, activeUsers, totalProducts, totalSales,
            t.SubscriptionStart, t.SubscriptionEnd, t.VatNumber, t.ZatcaEnabled, t.TrialEndDate);
}

// ════════════════════════════════════════════════════════════════
// UserService
// ════════════════════════════════════════════════════════════════

