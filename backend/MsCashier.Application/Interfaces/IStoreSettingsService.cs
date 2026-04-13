using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IStoreSettingsService
{
    // ─── Store branding (JSON in Tenant.Settings) ────
    Task<Result<StoreSettingsDto>> GetSettingsAsync();
    Task<Result<StoreSettingsDto>> SaveSettingsAsync(StoreSettingsDto settings);

    // ─── Multi-currency ──────────────────────────────
    Task<Result<List<TenantCurrencyDto>>> GetCurrenciesAsync();
    Task<Result<TenantCurrencyDto>> SaveCurrencyAsync(int? id, SaveTenantCurrencyRequest request);
    Task<Result<bool>> DeleteCurrencyAsync(int id);

    // ─── Tax config ──────────────────────────────────
    Task<Result<TenantTaxConfigDto>> GetTaxConfigAsync();
    Task<Result<TenantTaxConfigDto>> SaveTaxConfigAsync(SaveTaxConfigRequest request);
}
