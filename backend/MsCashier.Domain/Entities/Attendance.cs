using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class Attendance
{
    [Key]
    public long Id { get; set; }

    public Guid TenantId { get; set; }
    public int EmployeeId { get; set; }

    public DateOnly AttendanceDate { get; set; }
    public TimeOnly? CheckIn { get; set; }
    public TimeOnly? CheckOut { get; set; }

    public byte Status { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

