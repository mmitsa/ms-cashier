using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Attendance Device (Fingerprint readers: ZKTeco, Hikvision etc.)
// ============================================================

public class AttendanceDevice : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    [MaxLength(100)]
    public string? Model { get; set; }

    [Required, MaxLength(100)]
    public string IpAddress { get; set; } = default!;

    public int Port { get; set; } = 4370;

    [MaxLength(50)]
    public string? SerialNumber { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    public bool IsActive { get; set; } = true;

    public DeviceSyncStatus LastSyncStatus { get; set; } = DeviceSyncStatus.Idle;
    public DateTime? LastSyncAt { get; set; }
    public int? LastSyncRecords { get; set; }

    [MaxLength(500)]
    public string? LastSyncError { get; set; }
}

// ============================================================
// Attendance Punch (individual check-in/check-out punches)
// ============================================================

