using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// HR: Attendance Punch DTOs
// ============================================================
public record AttendancePunchDto(long Id, int EmployeeId, string EmployeeName,
    DateTime PunchTime, bool IsCheckIn, AttendancePunchSource Source,
    int? DeviceId, string? DeviceName, string? Notes);
public record ManualPunchRequest(int EmployeeId, DateTime PunchTime, bool IsCheckIn, string? Notes);

