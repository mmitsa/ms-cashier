using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Cashier Shift Management
// ============================================================

public interface ICashierShiftService
{
    Task<Result<CashierShiftDto>> OpenShiftAsync(OpenShiftRequest request);
    Task<Result<CashierShiftDto?>> GetCurrentShiftAsync();
    Task<Result<ShiftSummaryDto>> GetShiftSummaryAsync(int shiftId);
    Task<Result<CashierShiftDto>> CloseShiftAsync(CloseShiftRequest request);
    Task<Result<CashierShiftDto>> ForceCloseAsync(int shiftId, string reason);
    Task<Result<PagedResult<CashierShiftDto>>> ListShiftsAsync(ShiftListFilter filter);
}
