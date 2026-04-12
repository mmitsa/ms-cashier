using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// HR: Attendance Device DTOs
// ============================================================
public record AttendanceDeviceDto(int Id, string Name, string? Model, string IpAddress, int Port,
    string? SerialNumber, string? Location, bool IsActive,
    DeviceSyncStatus LastSyncStatus, DateTime? LastSyncAt, int? LastSyncRecords, string? LastSyncError);
public record SaveDeviceRequest(string Name, string? Model, string IpAddress, int Port,
    string? SerialNumber, string? Location);
public record DeviceSyncResult(bool Success, int RecordsSynced, string Message, int? DurationMs);

