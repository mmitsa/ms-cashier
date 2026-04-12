using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IInventoryService
{
    Task<Result<List<ProductDto>>> GetInventoryAsync(int warehouseId, string? search);
    Task<Result<bool>> AdjustStockAsync(int productId, int warehouseId, decimal newQuantity, string? notes);
    Task<Result<PagedResult<FinanceTransactionDto>>> GetMovementsAsync(int productId, DateTime from, DateTime to, int page, int pageSize);
}

