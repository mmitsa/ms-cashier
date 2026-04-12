using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// HR: Enhanced Employee DTOs
// ============================================================
public record EmployeeDetailDto(
    int Id, string Name, string? Phone, string? Email, string? NationalId,
    string? Position, string? Department, decimal BasicSalary,
    decimal HousingAllowance, decimal TransportAllowance, decimal OtherAllowance,
    string? DeviceUserId, string? BankName, string? BankAccount, string? IBAN,
    DateTime HireDate, DateTime? TerminationDate, bool IsActive,
    Guid? UserId, string? Username,
    List<SalaryConfigDto> SalaryConfigs);

public record CreateEmployeeDetailRequest(
    string Name, string? Phone, string? Email, string? NationalId,
    string? Position, string? Department, decimal BasicSalary,
    decimal HousingAllowance, decimal TransportAllowance, decimal OtherAllowance,
    string? DeviceUserId, string? BankName, string? BankAccount, string? IBAN,
    DateTime HireDate, string? Username, string? Password);

public record UpdateEmployeeRequest(
    string? Name, string? Phone, string? Email, string? NationalId,
    string? Position, string? Department, decimal? BasicSalary,
    decimal? HousingAllowance, decimal? TransportAllowance, decimal? OtherAllowance,
    string? DeviceUserId, string? BankName, string? BankAccount, string? IBAN,
    bool? IsActive);

