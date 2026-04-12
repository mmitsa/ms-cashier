using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface ITenantService
{
    Task<Result<TenantDto>> CreateTenantAsync(CreateTenantRequest request);
    Task<Result<PagedResult<TenantDto>>> GetAllTenantsAsync(int page, int pageSize);
    Task<Result<TenantDto>> GetTenantAsync(Guid id);
    Task<Result<TenantDto>> UpdateTenantAsync(Guid id, UpdateTenantRequest request);
    Task<Result<bool>> SuspendTenantAsync(Guid id);
    Task<Result<bool>> ActivateTenantAsync(Guid id);
}

