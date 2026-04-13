using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services;

public class StoreSettingsService : IStoreSettingsService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public StoreSettingsService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    // ─── STORE BRANDING (JSON in Tenant.Settings) ──────────

    public async Task<Result<StoreSettingsDto>> GetSettingsAsync()
    {
        try
        {
            var tenant = await GetTenantAsync();
            if (tenant is null) return Result<StoreSettingsDto>.Failure("المنشأة غير موجودة");

            var settings = string.IsNullOrWhiteSpace(tenant.Settings)
                ? new StoreSettingsDto()
                : JsonSerializer.Deserialize<StoreSettingsDto>(tenant.Settings, JsonOpts) ?? new StoreSettingsDto();

            // Fill from tenant fields if not set in JSON
            settings.StoreName ??= tenant.Name;
            settings.Phone1 ??= tenant.Phone;
            settings.Email ??= tenant.Email;
            settings.Address ??= tenant.Address;
            settings.City ??= tenant.City;
            settings.LogoUrl ??= tenant.LogoUrl;

            return Result<StoreSettingsDto>.Success(settings);
        }
        catch (Exception ex) { return Result<StoreSettingsDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<StoreSettingsDto>> SaveSettingsAsync(StoreSettingsDto settings)
    {
        try
        {
            var tenant = await GetTenantAsync();
            if (tenant is null) return Result<StoreSettingsDto>.Failure("المنشأة غير موجودة");

            // Sync key fields back to tenant entity
            if (!string.IsNullOrWhiteSpace(settings.StoreName)) tenant.Name = settings.StoreName;
            if (!string.IsNullOrWhiteSpace(settings.Phone1)) tenant.Phone = settings.Phone1;
            tenant.Email = settings.Email;
            tenant.Address = settings.Address;
            tenant.City = settings.City ?? tenant.City;
            tenant.LogoUrl = settings.LogoUrl;

            // Store full settings as JSON
            tenant.Settings = JsonSerializer.Serialize(settings, JsonOpts);
            _uow.Repository<Tenant>().Update(tenant);
            await _uow.SaveChangesAsync();

            return Result<StoreSettingsDto>.Success(settings, "تم حفظ الإعدادات");
        }
        catch (Exception ex) { return Result<StoreSettingsDto>.Failure($"خطأ: {ex.Message}"); }
    }

    // ─── MULTI-CURRENCY ────────────────────────────────────

    public async Task<Result<List<TenantCurrencyDto>>> GetCurrenciesAsync()
    {
        try
        {
            var currencies = await _uow.Repository<TenantCurrency>().Query()
                .Where(c => !c.IsDeleted)
                .OrderByDescending(c => c.IsDefault).ThenBy(c => c.CurrencyName)
                .AsNoTracking()
                .ToListAsync();

            return Result<List<TenantCurrencyDto>>.Success(currencies.Select(c => new TenantCurrencyDto(
                c.Id, c.CurrencyCode, c.CurrencyName, c.Symbol, c.ExchangeRate, c.IsDefault, c.IsActive)).ToList());
        }
        catch (Exception ex) { return Result<List<TenantCurrencyDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<TenantCurrencyDto>> SaveCurrencyAsync(int? id, SaveTenantCurrencyRequest request)
    {
        try
        {
            TenantCurrency currency;
            if (id.HasValue)
            {
                currency = await _uow.Repository<TenantCurrency>().GetByIdAsync(id.Value)
                    ?? throw new Exception("العملة غير موجودة");
                currency.CurrencyCode = request.CurrencyCode;
                currency.CurrencyName = request.CurrencyName;
                currency.Symbol = request.Symbol;
                currency.ExchangeRate = request.ExchangeRate;
                _uow.Repository<TenantCurrency>().Update(currency);
            }
            else
            {
                currency = new TenantCurrency
                {
                    CurrencyCode = request.CurrencyCode,
                    CurrencyName = request.CurrencyName,
                    Symbol = request.Symbol,
                    ExchangeRate = request.ExchangeRate,
                    IsDefault = request.IsDefault,
                    IsActive = true,
                };
                await _uow.Repository<TenantCurrency>().AddAsync(currency);
            }

            // If this is set as default, un-default others
            if (request.IsDefault)
            {
                var others = await _uow.Repository<TenantCurrency>().Query()
                    .Where(c => c.IsDefault && c.Id != currency.Id)
                    .ToListAsync();
                foreach (var o in others) { o.IsDefault = false; _uow.Repository<TenantCurrency>().Update(o); }
                currency.IsDefault = true;
                currency.ExchangeRate = 1; // default is always 1
            }

            await _uow.SaveChangesAsync();
            return Result<TenantCurrencyDto>.Success(new TenantCurrencyDto(
                currency.Id, currency.CurrencyCode, currency.CurrencyName, currency.Symbol,
                currency.ExchangeRate, currency.IsDefault, currency.IsActive), "تم حفظ العملة");
        }
        catch (Exception ex) { return Result<TenantCurrencyDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteCurrencyAsync(int id)
    {
        try
        {
            var currency = await _uow.Repository<TenantCurrency>().GetByIdAsync(id);
            if (currency is null) return Result<bool>.Failure("العملة غير موجودة");
            if (currency.IsDefault) return Result<bool>.Failure("لا يمكن حذف العملة الأساسية");
            currency.IsDeleted = true;
            _uow.Repository<TenantCurrency>().Update(currency);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف العملة");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    // ─── TAX CONFIG ────────────────────────────────────────

    public async Task<Result<TenantTaxConfigDto>> GetTaxConfigAsync()
    {
        try
        {
            var config = await _uow.Repository<TenantTaxConfig>().Query()
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (config is null)
                return Result<TenantTaxConfigDto>.Success(new TenantTaxConfigDto(
                    0, "ETA", false, null, null, null, null, null, 14, null, true, null, null, 0, 0, 0));

            return Result<TenantTaxConfigDto>.Success(MapTax(config));
        }
        catch (Exception ex) { return Result<TenantTaxConfigDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<TenantTaxConfigDto>> SaveTaxConfigAsync(SaveTaxConfigRequest request)
    {
        try
        {
            var existing = await _uow.Repository<TenantTaxConfig>().Query().FirstOrDefaultAsync();

            if (existing is not null)
            {
                existing.Provider = request.Provider;
                existing.IsEnabled = request.IsEnabled;
                existing.EtaClientId = request.EtaClientId;
                if (!string.IsNullOrWhiteSpace(request.EtaClientSecret))
                    existing.EtaClientSecret = request.EtaClientSecret;
                existing.EtaApiUrl = request.EtaApiUrl;
                existing.EtaBranchCode = request.EtaBranchCode;
                existing.EtaActivityCode = request.EtaActivityCode;
                existing.TaxRegistrationNumber = request.TaxRegistrationNumber;
                existing.DefaultVatRate = request.DefaultVatRate;
                existing.TableTaxRate = request.TableTaxRate;
                existing.TaxInclusive = request.TaxInclusive;
                _uow.Repository<TenantTaxConfig>().Update(existing);
            }
            else
            {
                existing = new TenantTaxConfig
                {
                    Provider = request.Provider,
                    IsEnabled = request.IsEnabled,
                    EtaClientId = request.EtaClientId,
                    EtaClientSecret = request.EtaClientSecret,
                    EtaApiUrl = request.EtaApiUrl,
                    EtaBranchCode = request.EtaBranchCode,
                    EtaActivityCode = request.EtaActivityCode,
                    TaxRegistrationNumber = request.TaxRegistrationNumber,
                    DefaultVatRate = request.DefaultVatRate,
                    TableTaxRate = request.TableTaxRate,
                    TaxInclusive = request.TaxInclusive,
                };
                await _uow.Repository<TenantTaxConfig>().AddAsync(existing);
            }

            await _uow.SaveChangesAsync();
            return Result<TenantTaxConfigDto>.Success(MapTax(existing), "تم حفظ إعدادات الضريبة");
        }
        catch (Exception ex) { return Result<TenantTaxConfigDto>.Failure($"خطأ: {ex.Message}"); }
    }

    // ─── Helpers ────────────────────────────────────────────

    private async Task<Tenant?> GetTenantAsync() =>
        await _uow.Repository<Tenant>().Query()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == _tenant.TenantId);

    private static TenantTaxConfigDto MapTax(TenantTaxConfig c) => new(
        c.Id, c.Provider, c.IsEnabled, c.EtaClientId, c.EtaApiUrl,
        c.EtaBranchCode, c.EtaActivityCode, c.TaxRegistrationNumber,
        c.DefaultVatRate, c.TableTaxRate, c.TaxInclusive,
        c.LastSyncAt, c.LastSyncStatus, c.TotalSubmitted, c.TotalAccepted, c.TotalRejected);
}
