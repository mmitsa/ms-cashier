using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IStorefrontService
{
    Task<Result<OnlineStoreDto>> GetStoreBySubdomainAsync(string subdomain);
    Task<Result<PagedResult<StorefrontProductDto>>> GetProductsAsync(int storeId, int? categoryId, string? search, int page, int pageSize);
    Task<Result<StorefrontProductDto>> GetProductByIdAsync(int storeId, int productId);
    Task<Result<List<StorefrontCategoryDto>>> GetCategoriesAsync(int storeId);
    Task<Result<List<StoreBannerDto>>> GetBannersAsync(int storeId);
    Task<Result<OnlineOrderDto>> CreateOrderAsync(int storeId, CreateOnlineOrderRequest request);
}
