using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IStockCountService
{
    Task<Result<StockCountDto>> StartAsync(StartStockCountRequest request);
    Task<Result<StockCountDto>> GetAsync(int id);
    Task<Result<List<StockCountDto>>> GetAllAsync();
    Task<Result<List<StockCountItemDto>>> GetItemsAsync(int stockCountId);
    Task<Result<StockCountItemDto>> ScanProductAsync(int stockCountId, ScanProductRequest request);
    Task<Result<StockCountItemDto>> SetCountedQtyAsync(int stockCountId, long itemId, SetCountedQtyRequest request);
    Task<Result<StockCountItemDto>> SettleItemAsync(int stockCountId, long itemId, SettleItemRequest request);
    Task<Result<StockCountDto>> CompleteAsync(int id);
    Task<Result<bool>> CancelAsync(int id);
    Task<Result<int>> BulkSetOpeningBalancesAsync(BulkOpeningBalanceRequest request);
}
