using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface ITenantModuleService
{
    Task<Result<List<TenantModuleDto>>> GetModulesAsync(Guid tenantId);
    Task<Result<List<TenantModuleDto>>> UpdateModulesAsync(Guid tenantId, UpdateTenantModulesRequest request, Guid? updatedBy = null);
    Task<Result<List<TenantModuleDto>>> GetCurrentTenantModulesAsync();
    Task<Result<bool>> IsEnabledAsync(Guid tenantId, string moduleKey);
}
