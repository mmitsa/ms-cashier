using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Floor Section Service
// ============================================================

public interface IFloorSectionService
{
    Task<Result<FloorOverviewDto>> GetFloorOverviewAsync(int? branchId);
    Task<Result<List<FloorSectionDto>>> GetSectionsAsync(int? branchId);
    Task<Result<FloorSectionDto>> GetByIdAsync(int id);
    Task<Result<FloorSectionDto>> SaveAsync(int? id, SaveFloorSectionRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<bool>> ReorderAsync(List<int> sectionIds);
    Task<Result<bool>> AssignTableToSectionAsync(int tableId, int sectionId);
    Task<Result<bool>> RemoveTableFromSectionAsync(int tableId);
}

// ============================================================
// QR Config Service (store owner)
// ============================================================

