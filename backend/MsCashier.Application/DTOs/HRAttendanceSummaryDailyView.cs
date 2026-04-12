using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// HR: Attendance Summary (daily view)
// ============================================================
public record AttendanceDailySummaryDto(int EmployeeId, string EmployeeName, string? Department,
    DateOnly Date, TimeOnly? FirstCheckIn, TimeOnly? LastCheckOut,
    double? TotalHours, AttendanceStatus Status, List<AttendancePunchDto> Punches);
public record AttendanceMonthSummaryDto(int EmployeeId, string EmployeeName, string? Department,
    int Month, int Year, int WorkingDays, int PresentDays, int AbsentDays,
    int LateDays, int LeaveDays, double TotalHours);
public record AttendanceFilterRequest(DateOnly? DateFrom, DateOnly? DateTo,
    int? EmployeeId, string? Department, int Page = 1, int PageSize = 50);

