using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services;

public class IntegrationService : IIntegrationService
{
    private readonly IUnitOfWork _uow;
    private readonly IAuditService _audit;
    private readonly HttpClient _http;

    public IntegrationService(IUnitOfWork uow, IAuditService audit, IHttpClientFactory httpFactory)
    {
        _uow = uow;
        _audit = audit;
        _http = httpFactory.CreateClient();
    }

    public Task<Result<List<IntegrationProviderInfo>>> GetCatalogAsync()
        => Task.FromResult(Result<List<IntegrationProviderInfo>>.Success(IntegrationCatalog.Providers));

    public async Task<Result<List<TenantIntegrationDto>>> GetAllAsync()
    {
        try
        {
            var items = await _uow.Repository<TenantIntegration>().Query()
                .Where(i => !i.IsDeleted)
                .OrderBy(i => i.Category).ThenBy(i => i.Provider)
                .AsNoTracking()
                .ToListAsync();
            return Result<List<TenantIntegrationDto>>.Success(items.Select(Map).ToList());
        }
        catch (Exception ex) { return Result<List<TenantIntegrationDto>>.Failure(ex.Message); }
    }

    public async Task<Result<TenantIntegrationDto>> GetByIdAsync(int id)
    {
        try
        {
            var item = await _uow.Repository<TenantIntegration>().GetByIdAsync(id);
            if (item is null) return Result<TenantIntegrationDto>.Failure("التكامل غير موجود");
            return Result<TenantIntegrationDto>.Success(Map(item));
        }
        catch (Exception ex) { return Result<TenantIntegrationDto>.Failure(ex.Message); }
    }

    public async Task<Result<TenantIntegrationDto>> SaveAsync(int? id, SaveIntegrationRequest request)
    {
        try
        {
            TenantIntegration item;
            if (id.HasValue)
            {
                item = await _uow.Repository<TenantIntegration>().GetByIdAsync(id.Value)
                    ?? throw new Exception("التكامل غير موجود");
            }
            else
            {
                // Check no duplicate provider for this tenant
                var exists = await _uow.Repository<TenantIntegration>().Query()
                    .AnyAsync(i => i.Provider == request.Provider && !i.IsDeleted);
                if (exists) return Result<TenantIntegrationDto>.Failure($"يوجد تكامل مع {request.Provider} بالفعل");

                item = new TenantIntegration();
                await _uow.Repository<TenantIntegration>().AddAsync(item);
            }

            item.Category = request.Category;
            item.Provider = request.Provider;
            item.DisplayName = request.DisplayName;
            item.IsEnabled = request.IsEnabled;
            item.MerchantId = request.MerchantId;
            item.StoreUrl = request.StoreUrl;
            item.WebhookSecret = request.WebhookSecret;
            item.ExtraSettings = request.ExtraSettings;
            item.SyncProducts = request.SyncProducts;
            item.SyncOrders = request.SyncOrders;
            item.SyncInventory = request.SyncInventory;

            // Only update secrets if provided (don't overwrite with null)
            if (!string.IsNullOrWhiteSpace(request.ApiKey)) item.ApiKey = request.ApiKey;
            if (!string.IsNullOrWhiteSpace(request.ApiSecret)) item.ApiSecret = request.ApiSecret;
            if (!string.IsNullOrWhiteSpace(request.AccessToken)) item.AccessToken = request.AccessToken;

            // Generate webhook URL for this integration
            item.WebhookUrl = $"/api/v1/webhooks/{item.Provider.ToLower()}/{item.Id}";

            if (!id.HasValue) await _uow.SaveChangesAsync(); // get Id
            _uow.Repository<TenantIntegration>().Update(item);
            await _uow.SaveChangesAsync();

            await _audit.LogAsync(id.HasValue ? "UpdateIntegration" : "CreateIntegration",
                "TenantIntegration", item.Id.ToString(), newValues: $"Provider={item.Provider}");

            return Result<TenantIntegrationDto>.Success(Map(item), "تم حفظ التكامل");
        }
        catch (Exception ex) { return Result<TenantIntegrationDto>.Failure(ex.Message); }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var item = await _uow.Repository<TenantIntegration>().GetByIdAsync(id);
            if (item is null) return Result<bool>.Failure("التكامل غير موجود");
            item.IsDeleted = true;
            item.IsEnabled = false;
            _uow.Repository<TenantIntegration>().Update(item);
            await _uow.SaveChangesAsync();
            await _audit.LogAsync("DeleteIntegration", "TenantIntegration", id.ToString());
            return Result<bool>.Success(true, "تم حذف التكامل");
        }
        catch (Exception ex) { return Result<bool>.Failure(ex.Message); }
    }

    public async Task<Result<bool>> ToggleAsync(int id)
    {
        try
        {
            var item = await _uow.Repository<TenantIntegration>().GetByIdAsync(id);
            if (item is null) return Result<bool>.Failure("التكامل غير موجود");
            item.IsEnabled = !item.IsEnabled;
            _uow.Repository<TenantIntegration>().Update(item);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, item.IsEnabled ? "تم تفعيل التكامل" : "تم تعطيل التكامل");
        }
        catch (Exception ex) { return Result<bool>.Failure(ex.Message); }
    }

    public async Task<Result<bool>> TestConnectionAsync(int id)
    {
        try
        {
            var item = await _uow.Repository<TenantIntegration>().GetByIdAsync(id);
            if (item is null) return Result<bool>.Failure("التكامل غير موجود");

            // Provider-specific connection test
            var testUrl = item.Provider switch
            {
                "Salla" => $"{item.StoreUrl}/api/v1/me",
                "Shopify" => $"{item.StoreUrl}/admin/api/2024-01/shop.json",
                "Tabby" => "https://api.tabby.ai/api/v2/checkout",
                "Tamara" => "https://api.tamara.co/merchants/info",
                "ValU" => "https://api.valu.com.eg/v1/merchant/info",
                "Bosta" => "https://app.bosta.co/api/v2/cities",
                _ => null,
            };

            if (testUrl is null)
            {
                item.LastSyncStatus = "No test endpoint for this provider";
                item.LastSyncAt = DateTime.UtcNow;
                _uow.Repository<TenantIntegration>().Update(item);
                await _uow.SaveChangesAsync();
                return Result<bool>.Success(true, "لا يوجد اختبار اتصال لهذا المزود");
            }

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, testUrl);
                if (!string.IsNullOrWhiteSpace(item.AccessToken))
                    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", item.AccessToken);
                else if (!string.IsNullOrWhiteSpace(item.ApiKey))
                    request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {item.ApiKey}");

                var response = await _http.SendAsync(request);

                item.LastSyncAt = DateTime.UtcNow;
                item.LastSyncStatus = response.IsSuccessStatusCode ? "Connected" : $"HTTP {(int)response.StatusCode}";
                _uow.Repository<TenantIntegration>().Update(item);
                await _uow.SaveChangesAsync();

                return response.IsSuccessStatusCode
                    ? Result<bool>.Success(true, "تم الاتصال بنجاح")
                    : Result<bool>.Failure($"فشل الاتصال: HTTP {(int)response.StatusCode}");
            }
            catch (HttpRequestException ex)
            {
                item.LastSyncAt = DateTime.UtcNow;
                item.LastSyncStatus = $"Error: {ex.Message}";
                _uow.Repository<TenantIntegration>().Update(item);
                await _uow.SaveChangesAsync();
                return Result<bool>.Failure($"فشل الاتصال: {ex.Message}");
            }
        }
        catch (Exception ex) { return Result<bool>.Failure(ex.Message); }
    }

    private static TenantIntegrationDto Map(TenantIntegration i) => new(
        i.Id, i.Category, i.Provider, i.DisplayName, i.IsEnabled,
        i.MerchantId, i.StoreUrl, i.WebhookUrl,
        i.SyncProducts, i.SyncOrders, i.SyncInventory,
        i.LastSyncAt, i.LastSyncStatus, i.TotalSynced, i.TotalErrors,
        !string.IsNullOrWhiteSpace(i.ApiKey), !string.IsNullOrWhiteSpace(i.AccessToken));
}
