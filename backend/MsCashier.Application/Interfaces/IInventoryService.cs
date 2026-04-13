using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IInventoryService
{
    Task<Result<List<ProductDto>>> GetInventoryAsync(int warehouseId, string? search);
    Task<Result<bool>> AdjustStockAsync(int productId, int warehouseId, decimal newQuantity, string? notes);
    Task<Result<PagedResult<FinanceTransactionDto>>> GetMovementsAsync(int productId, DateTime from, DateTime to, int page, int pageSize);

    /// <summary>Stock breakdown per warehouse for a specific product</summary>
    Task<Result<List<ProductWarehouseStockDto>>> GetProductStockByWarehouseAsync(int productId);

    /// <summary>Summary stats for the inventory dashboard</summary>
    Task<Result<InventoryDashboardDto>> GetDashboardAsync();
}
