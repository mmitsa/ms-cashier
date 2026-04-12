using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// HR: Attendance Device Management
// ============================================================
public interface IAttendanceDeviceService
{
    Task<Result<List<AttendanceDeviceDto>>> GetAllAsync();
    Task<Result<AttendanceDeviceDto>> SaveAsync(int? id, SaveDeviceRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<DeviceSyncResult>> SyncDeviceAsync(int deviceId);
    Task<Result<DeviceSyncResult>> SyncAllDevicesAsync();
    Task<Result<bool>> TestConnectionAsync(int deviceId);
}

