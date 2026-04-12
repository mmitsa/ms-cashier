using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 8. EmployeeService
// ════════════════════════════════════════════════════════════════

public class EmployeeService : IEmployeeService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public EmployeeService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<EmployeeDto>> CreateAsync(CreateEmployeeRequest request)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            Guid? userId = null;

            if (!string.IsNullOrEmpty(request.Username) && !string.IsNullOrEmpty(request.Password))
            {
                var userExists = await _uow.Repository<User>().AnyAsync(u =>
                    u.TenantId == _tenant.TenantId &&
                    u.Username == request.Username &&
                    !u.IsDeleted);

                if (userExists)
                {
                    await _uow.RollbackTransactionAsync();
                    return Result<EmployeeDto>.Failure("اسم المستخدم مستخدم بالفعل");
                }

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    TenantId = _tenant.TenantId,
                    Username = request.Username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    FullName = request.Name,
                    Phone = request.Phone,
                    Role = "Employee",
                    IsActive = true
                };

                await _uow.Repository<User>().AddAsync(user);
                await _uow.SaveChangesAsync();
                userId = user.Id;
            }

            var employee = new Employee
            {
                TenantId = _tenant.TenantId,
                UserId = userId,
                Name = request.Name,
                Phone = request.Phone,
                NationalId = request.NationalId,
                Position = request.Position,
                Department = request.Department,
                BasicSalary = request.BasicSalary,
                HireDate = request.HireDate,
                IsActive = true
            };

            await _uow.Repository<Employee>().AddAsync(employee);
            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            return Result<EmployeeDto>.Success(
                new EmployeeDto(employee.Id, employee.Name, employee.Phone,
                    employee.Position, employee.Department, employee.BasicSalary,
                    employee.HireDate, employee.IsActive),
                "تم إنشاء الموظف بنجاح");
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<EmployeeDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<List<EmployeeDto>>> GetAllAsync()
    {
        try
        {
            var employees = await _uow.Repository<Employee>().Query()
                .Where(e => e.TenantId == _tenant.TenantId && !e.IsDeleted)
                .OrderBy(e => e.Name)
                .Select(e => new EmployeeDto(
                    e.Id, e.Name, e.Phone, e.Position, e.Department,
                    e.BasicSalary, e.HireDate, e.IsActive))
                .ToListAsync();

            return Result<List<EmployeeDto>>.Success(employees);
        }
        catch (Exception ex)
        {
            return Result<List<EmployeeDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> RecordAttendanceAsync(int empId, DateTime date, TimeSpan? checkIn, TimeSpan? checkOut, byte status)
    {
        try
        {
            var employee = await _uow.Repository<Employee>().Query()
                .FirstOrDefaultAsync(e =>
                    e.Id == empId &&
                    e.TenantId == _tenant.TenantId &&
                    !e.IsDeleted);

            if (employee is null)
                return Result<bool>.Failure("الموظف غير موجود");

            var attendanceDate = DateOnly.FromDateTime(date);

            var existing = await _uow.Repository<Attendance>().Query()
                .FirstOrDefaultAsync(a =>
                    a.TenantId == _tenant.TenantId &&
                    a.EmployeeId == empId &&
                    a.AttendanceDate == attendanceDate);

            if (existing is not null)
            {
                existing.CheckIn = checkIn.HasValue ? TimeOnly.FromTimeSpan(checkIn.Value) : null;
                existing.CheckOut = checkOut.HasValue ? TimeOnly.FromTimeSpan(checkOut.Value) : null;
                existing.Status = status;
                _uow.Repository<Attendance>().Update(existing);
            }
            else
            {
                var attendance = new Attendance
                {
                    TenantId = _tenant.TenantId,
                    EmployeeId = empId,
                    AttendanceDate = attendanceDate,
                    CheckIn = checkIn.HasValue ? TimeOnly.FromTimeSpan(checkIn.Value) : null,
                    CheckOut = checkOut.HasValue ? TimeOnly.FromTimeSpan(checkOut.Value) : null,
                    Status = status
                };
                await _uow.Repository<Attendance>().AddAsync(attendance);
            }

            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم تسجيل الحضور بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ProcessPayrollAsync(int month, int year)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var employees = await _uow.Repository<Employee>().Query()
                .Where(e =>
                    e.TenantId == _tenant.TenantId &&
                    e.IsActive &&
                    !e.IsDeleted)
                .ToListAsync();

            foreach (var emp in employees)
            {
                var existing = await _uow.Repository<Payroll>().Query()
                    .FirstOrDefaultAsync(p =>
                        p.TenantId == _tenant.TenantId &&
                        p.EmployeeId == emp.Id &&
                        p.Month == month &&
                        p.Year == year);

                if (existing is not null)
                    continue;

                var startDate = new DateOnly(year, month, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);
                var workingDays = 0;
                for (var d = startDate; d <= endDate; d = d.AddDays(1))
                {
                    if (d.DayOfWeek != DayOfWeek.Friday && d.DayOfWeek != DayOfWeek.Saturday)
                        workingDays++;
                }

                var presentDays = await _uow.Repository<Attendance>().Query()
                    .CountAsync(a =>
                        a.TenantId == _tenant.TenantId &&
                        a.EmployeeId == emp.Id &&
                        a.AttendanceDate >= startDate &&
                        a.AttendanceDate <= endDate &&
                        a.Status == (byte)AttendanceStatus.Present);

                var absentDays = workingDays - presentDays;
                var dailyRate = workingDays > 0 ? emp.BasicSalary / workingDays : 0;
                var deductions = Math.Round(Math.Max(0, absentDays) * dailyRate, 2);

                var payroll = new Payroll
                {
                    TenantId = _tenant.TenantId,
                    EmployeeId = emp.Id,
                    Month = month,
                    Year = year,
                    BasicSalary = emp.BasicSalary,
                    Allowances = 0,
                    Deductions = deductions,
                    Bonus = 0,
                    NetSalary = emp.BasicSalary - deductions,
                    IsPaid = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _uow.Repository<Payroll>().AddAsync(payroll);
            }

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            return Result<bool>.Success(true, "تم معالجة الرواتب بنجاح");
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }
}

// ════════════════════════════════════════════════════════════════
// 9. InstallmentService
// ════════════════════════════════════════════════════════════════

