using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IIntegrationService
{
    Task<Result<List<IntegrationProviderInfo>>> GetCatalogAsync();
    Task<Result<List<TenantIntegrationDto>>> GetAllAsync();
    Task<Result<TenantIntegrationDto>> GetByIdAsync(int id);
    Task<Result<TenantIntegrationDto>> SaveAsync(int? id, SaveIntegrationRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<bool>> ToggleAsync(int id);
    Task<Result<bool>> TestConnectionAsync(int id);
}
