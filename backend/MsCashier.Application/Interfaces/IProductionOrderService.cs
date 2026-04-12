using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Production Order Management
// ============================================================

public interface IProductionOrderService
{
    Task<Result<ProductionOrderDto>> CreateAsync(CreateProductionOrderRequest request);
    Task<Result<ProductionOrderDto>> GetByIdAsync(int id);
    Task<Result<PagedResult<ProductionOrderDto>>> SearchAsync(ProductionOrderFilterRequest request);
    Task<Result<ProductionOrderDto>> UpdateAsync(int id, UpdateProductionOrderRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<ProductionOrderDto>> ApproveAsync(int id);
    Task<Result<ProductionOrderDto>> StartAsync(int id);
    Task<Result<ProductionOrderDto>> CompleteAsync(int id, CompleteProductionRequest request);
    Task<Result<ProductionOrderDto>> CancelAsync(int id, string? reason);
}

// ============================================================
// Production Waste Management
// ============================================================

