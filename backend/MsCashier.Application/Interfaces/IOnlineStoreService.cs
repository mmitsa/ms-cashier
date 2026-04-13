using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IOnlineStoreService
{
    Task<Result<OnlineStoreDto>> GetStoreAsync();
    Task<Result<OnlineStoreDto>> CreateOrUpdateStoreAsync(CreateOnlineStoreRequest request);
    Task<Result<List<StoreBannerDto>>> GetBannersAsync();
    Task<Result<StoreBannerDto>> SaveBannerAsync(StoreBannerDto banner);
    Task<Result<bool>> DeleteBannerAsync(int bannerId);
    Task<Result<PagedResult<OnlineOrderDto>>> GetOrdersAsync(int page, int pageSize, OnlineOrderStatus? status);
    Task<Result<OnlineOrderDto>> GetOrderByIdAsync(long orderId);
    Task<Result<OnlineOrderDto>> UpdateOrderStatusAsync(long orderId, UpdateOrderStatusRequest request);
    Task<Result<OnlineOrderDto>> LinkOrderToInvoiceAsync(long orderId, long invoiceId);
    Task<Result<List<OnlinePaymentConfigDto>>> GetPaymentConfigsAsync();
    Task<Result<OnlinePaymentConfigDto>> SavePaymentConfigAsync(OnlinePaymentConfigDto config);
    Task<Result<List<StoreShippingConfigDto>>> GetShippingConfigsAsync();
    Task<Result<StoreShippingConfigDto>> SaveShippingConfigAsync(StoreShippingConfigDto config);
    Task<Result<StoreDashboardDto>> GetDashboardAsync();
}
