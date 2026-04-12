using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Branch Management
// ============================================================

public interface IBranchService
{
    // Tenant-side
    Task<Result<List<BranchDto>>> GetBranchesAsync();
    Task<Result<BranchDto>> GetBranchByIdAsync(int id);
    Task<Result<BranchSummaryDto>> GetSummaryAsync();
    Task<Result<BranchPlanInfoDto>> GetPlanInfoAsync();
    Task<Result<BranchDto>> UpdateBranchAsync(int id, UpdateBranchDto dto);
    Task<Result<bool>> SuspendBranchAsync(int id);
    Task<Result<bool>> ActivateBranchAsync(int id);
    Task<Result<bool>> AssignWarehouseAsync(AssignWarehouseToBranchDto dto);
    Task<Result<bool>> UnassignWarehouseAsync(int warehouseId);

    // Branch requests (tenant creates request)
    Task<Result<BranchRequestDto>> CreateBranchRequestAsync(CreateBranchRequestDto dto);
    Task<Result<List<BranchRequestDto>>> GetMyRequestsAsync();
    Task<Result<BranchRequestDto>> RecordPaymentAsync(int requestId, BranchPaymentDto dto);

    // Admin-side
    Task<Result<PagedResult<BranchRequestDto>>> GetAllRequestsAsync(int page, int size, string? status);
    Task<Result<BranchRequestDto>> ReviewRequestAsync(int requestId, AdminReviewBranchRequestDto dto);
    Task<Result<BranchRequestDto>> ActivateAfterPaymentAsync(int requestId);
}

// ============================================================
// Restaurant Tables
// ============================================================

