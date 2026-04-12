using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IWarehouseService
{
    Task<Result<WarehouseDto>> CreateAsync(string name, string? location, bool isMain);
    Task<Result<List<WarehouseDto>>> GetAllAsync();
    Task<Result<bool>> TransferStockAsync(StockTransferRequest request);
}

