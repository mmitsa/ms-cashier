using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Production Waste Management
// ============================================================

public interface IProductionWasteService
{
    Task<Result<ProductionWasteDto>> CreateAsync(CreateWasteRequest request);
    Task<Result<PagedResult<ProductionWasteDto>>> SearchAsync(WasteFilterRequest request);
    Task<Result<WasteSummaryDto>> GetSummaryAsync(DateTime from, DateTime to, int? branchId);
    Task<Result<bool>> DeleteAsync(long id);
}

