using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Employee
public record EmployeeDto(int Id, string Name, string? Phone, string? Position, string? Department, decimal BasicSalary, DateTime HireDate, bool IsActive);
public record CreateEmployeeRequest(string Name, string? Phone, string? NationalId, string? Position, string? Department, decimal BasicSalary, DateTime HireDate, string? Username, string? Password);
public record AttendanceRequest(DateTime Date, TimeSpan? CheckIn, TimeSpan? CheckOut, byte Status);

