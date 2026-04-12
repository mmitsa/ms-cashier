using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// HR: Employee, Attendance, Payroll
// ============================================================

public class Employee : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public Guid? UserId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? NationalId { get; set; }

    [MaxLength(100)]
    public string? Position { get; set; }

    [MaxLength(100)]
    public string? Department { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BasicSalary { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal HousingAllowance { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TransportAllowance { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherAllowance { get; set; }

    [MaxLength(50)]
    public string? DeviceUserId { get; set; }

    [MaxLength(200)]
    public string? BankName { get; set; }

    [MaxLength(100)]
    public string? BankAccount { get; set; }

    [MaxLength(50)]
    public string? IBAN { get; set; }

    public DateTime HireDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public User? User { get; set; }
    public ICollection<SalaryConfig> SalaryConfigs { get; set; } = new List<SalaryConfig>();
}

