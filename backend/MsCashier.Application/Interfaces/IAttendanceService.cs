using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// HR: Attendance Management
// ============================================================
public interface IAttendanceService
{
    Task<Result<AttendancePunchDto>> ManualPunchAsync(ManualPunchRequest request);
    Task<Result<PagedResult<AttendanceDailySummaryDto>>> GetDailySummaryAsync(AttendanceFilterRequest filter);
    Task<Result<List<AttendanceMonthSummaryDto>>> GetMonthSummaryAsync(int month, int year, int? employeeId);
    Task<Result<List<AttendancePunchDto>>> GetPunchesAsync(int employeeId, DateOnly dateFrom, DateOnly dateTo);
    Task<Result<bool>> DeletePunchAsync(long punchId);
}

