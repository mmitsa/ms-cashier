using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IEmployeeService
{
    Task<Result<EmployeeDto>> CreateAsync(CreateEmployeeRequest request);
    Task<Result<List<EmployeeDto>>> GetAllAsync();
    Task<Result<bool>> RecordAttendanceAsync(int empId, DateTime date, TimeSpan? checkIn, TimeSpan? checkOut, byte status);
    Task<Result<bool>> ProcessPayrollAsync(int month, int year);
}

