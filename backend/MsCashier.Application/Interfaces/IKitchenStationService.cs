using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Kitchen Station Management
// ============================================================

public interface IKitchenStationService
{
    Task<Result<List<KitchenStationDto>>> GetAllAsync(int? branchId);
    Task<Result<KitchenStationDto>> GetByIdAsync(int id);
    Task<Result<KitchenStationDto>> SaveAsync(int? id, SaveKitchenStationRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<ProductKitchenStationDto>> AssignProductAsync(AssignProductToStationRequest request);
    Task<Result<bool>> RemoveProductAsync(int productId);
    Task<Result<List<ProductKitchenStationDto>>> GetProductAssignmentsAsync(int? stationId);
}

// ============================================================
// Production Order Management
// ============================================================

