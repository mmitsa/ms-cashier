using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Attendance Punch (individual check-in/check-out punches)
// ============================================================

public class AttendancePunch : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int EmployeeId { get; set; }
    public DateTime PunchTime { get; set; }
    public bool IsCheckIn { get; set; }
    public AttendancePunchSource Source { get; set; }
    public int? DeviceId { get; set; }

    [MaxLength(50)]
    public string? DeviceUserId { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation
    public Employee? Employee { get; set; }
    public AttendanceDevice? Device { get; set; }
}

// ============================================================
// Employee Salary Config (allowances, deductions per employee)
// ============================================================

