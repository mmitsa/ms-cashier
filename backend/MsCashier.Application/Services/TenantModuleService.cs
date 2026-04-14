using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services;

public class TenantModuleService : ITenantModuleService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _currentTenant;

    public TenantModuleService(IUnitOfWork uow, ICurrentTenantService currentTenant)
    {
        _uow = uow;
        _currentTenant = currentTenant;
    }

    public async Task<Result<List<TenantModuleDto>>> GetModulesAsync(Guid tenantId)
    {
        try
        {
            var existing = await _uow.Repository<TenantModule>().Query()
                .IgnoreQueryFilters()
                .Where(m => m.TenantId == tenantId)
                .AsNoTracking()
                .ToListAsync();

            var existingMap = existing.ToDictionary(e => e.ModuleKey, StringComparer.OrdinalIgnoreCase);

            var result = ModuleKey.All.Select(def =>
            {
                if (existingMap.TryGetValue(def.Key, out var row))
                    return new TenantModuleDto(def.Key, def.NameAr, def.Category, row.IsEnabled, row.EnabledAt);
                return new TenantModuleDto(def.Key, def.NameAr, def.Category, def.DefaultEnabled, null);
            }).ToList();

            return Result<List<TenantModuleDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<List<TenantModuleDto>>.Failure($"خطأ أثناء تحميل الوحدات: {ex.Message}");
        }
    }

    public async Task<Result<List<TenantModuleDto>>> UpdateModulesAsync(Guid tenantId, UpdateTenantModulesRequest request, Guid? updatedBy = null)
    {
        try
        {
            var tenantExists = await _uow.Repository<Tenant>().Query()
                .IgnoreQueryFilters()
                .AnyAsync(t => t.Id == tenantId);
            if (!tenantExists)
                return Result<List<TenantModuleDto>>.Failure("المتجر غير موجود");

            var validKeys = ModuleKey.All.Select(m => m.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);

            var existing = await _uow.Repository<TenantModule>().Query()
                .IgnoreQueryFilters()
                .Where(m => m.TenantId == tenantId)
                .ToListAsync();

            var existingMap = existing.ToDictionary(e => e.ModuleKey, StringComparer.OrdinalIgnoreCase);

            foreach (var toggle in request.Modules)
            {
                if (!validKeys.Contains(toggle.Key)) continue;

                if (existingMap.TryGetValue(toggle.Key, out var row))
                {
                    if (row.IsEnabled != toggle.IsEnabled)
                    {
                        row.IsEnabled = toggle.IsEnabled;
                        row.EnabledAt = toggle.IsEnabled ? DateTime.UtcNow : row.EnabledAt;
                        row.EnabledBy = updatedBy;
                        row.UpdatedAt = DateTime.UtcNow;
                        _uow.Repository<TenantModule>().Update(row);
                    }
                }
                else
                {
                    await _uow.Repository<TenantModule>().AddAsync(new TenantModule
                    {
                        TenantId = tenantId,
                        ModuleKey = toggle.Key,
                        IsEnabled = toggle.IsEnabled,
                        EnabledAt = toggle.IsEnabled ? DateTime.UtcNow : null,
                        EnabledBy = updatedBy,
                    });
                }
            }

            await _uow.SaveChangesAsync();
            return await GetModulesAsync(tenantId);
        }
        catch (Exception ex)
        {
            return Result<List<TenantModuleDto>>.Failure($"خطأ أثناء تحديث الوحدات: {ex.Message}");
        }
    }

    public async Task<Result<List<TenantModuleDto>>> GetCurrentTenantModulesAsync()
    {
        if (_currentTenant.TenantId == Guid.Empty)
            return Result<List<TenantModuleDto>>.Failure("لا يوجد مستأجر حالي");
        return await GetModulesAsync(_currentTenant.TenantId);
    }

    public async Task<Result<bool>> IsEnabledAsync(Guid tenantId, string moduleKey)
    {
        var modules = await GetModulesAsync(tenantId);
        if (!modules.IsSuccess || modules.Data is null)
            return Result<bool>.Success(false);
        var match = modules.Data.FirstOrDefault(m => string.Equals(m.Key, moduleKey, StringComparison.OrdinalIgnoreCase));
        return Result<bool>.Success(match?.IsEnabled ?? false);
    }
}
