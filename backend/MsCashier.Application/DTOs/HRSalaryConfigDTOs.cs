using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// HR: Salary Config DTOs
// ============================================================
public record SalaryConfigDto(int Id, int EmployeeId, string EmployeeName, string ItemName,
    PayrollItemType ItemType, decimal Amount, bool IsPercentage, bool IsActive, string? Notes);
public record SaveSalaryConfigRequest(int EmployeeId, string ItemName,
    PayrollItemType ItemType, decimal Amount, bool IsPercentage, string? Notes);

