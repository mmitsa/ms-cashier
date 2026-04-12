using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// HR: Employee Detail Service
// ════════════════════════════════════════════════════════════════

public class EmployeeDetailService : IEmployeeDetailService
{
    private readonly IUnitOfWork _uow;
    public EmployeeDetailService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<EmployeeDetailDto>> CreateAsync(CreateEmployeeDetailRequest req)
    {
        try
        {
            var emp = new Employee
            {
                Name = req.Name, Phone = req.Phone, Email = req.Email,
                NationalId = req.NationalId, Position = req.Position,
                Department = req.Department, BasicSalary = req.BasicSalary,
                HousingAllowance = req.HousingAllowance, TransportAllowance = req.TransportAllowance,
                OtherAllowance = req.OtherAllowance, DeviceUserId = req.DeviceUserId,
                BankName = req.BankName, BankAccount = req.BankAccount, IBAN = req.IBAN,
                HireDate = req.HireDate, IsActive = true
            };

            if (!string.IsNullOrEmpty(req.Username) && !string.IsNullOrEmpty(req.Password))
            {
                var existingUser = await _uow.Repository<User>().Query()
                    .AnyAsync(u => u.Username == req.Username && !u.IsDeleted);
                if (existingUser) return Result<EmployeeDetailDto>.Failure("اسم المستخدم موجود بالفعل");

                var user = new User
                {
                    Id = Guid.NewGuid(), Username = req.Username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                    FullName = req.Name, Phone = req.Phone, Email = req.Email,
                    Role = "Employee", IsActive = true
                };
                await _uow.Repository<User>().AddAsync(user);
                emp.UserId = user.Id;
            }

            await _uow.Repository<Employee>().AddAsync(emp);
            await _uow.SaveChangesAsync();
            return Result<EmployeeDetailDto>.Success(MapDetail(emp), "تم إضافة الموظف بنجاح");
        }
        catch (Exception ex) { return Result<EmployeeDetailDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<List<EmployeeDetailDto>>> GetAllAsync(bool? activeOnly)
    {
        try
        {
            var query = _uow.Repository<Employee>().Query()
                .Include(e => e.User)
                .Include(e => e.SalaryConfigs.Where(s => !s.IsDeleted))
                .Where(e => !e.IsDeleted);
            if (activeOnly == true) query = query.Where(e => e.IsActive);
            var list = await query.OrderBy(e => e.Name).ToListAsync();
            return Result<List<EmployeeDetailDto>>.Success(list.Select(MapDetail).ToList());
        }
        catch (Exception ex) { return Result<List<EmployeeDetailDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<EmployeeDetailDto>> GetByIdAsync(int id)
    {
        try
        {
            var emp = await _uow.Repository<Employee>().Query()
                .Include(e => e.User).Include(e => e.SalaryConfigs.Where(s => !s.IsDeleted))
                .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
            if (emp is null) return Result<EmployeeDetailDto>.Failure("الموظف غير موجود");
            return Result<EmployeeDetailDto>.Success(MapDetail(emp));
        }
        catch (Exception ex) { return Result<EmployeeDetailDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<EmployeeDetailDto>> UpdateAsync(int id, UpdateEmployeeRequest req)
    {
        try
        {
            var emp = await _uow.Repository<Employee>().Query()
                .Include(e => e.User).Include(e => e.SalaryConfigs)
                .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
            if (emp is null) return Result<EmployeeDetailDto>.Failure("الموظف غير موجود");

            if (req.Name != null) emp.Name = req.Name;
            if (req.Phone != null) emp.Phone = req.Phone;
            if (req.Email != null) emp.Email = req.Email;
            if (req.NationalId != null) emp.NationalId = req.NationalId;
            if (req.Position != null) emp.Position = req.Position;
            if (req.Department != null) emp.Department = req.Department;
            if (req.BasicSalary.HasValue) emp.BasicSalary = req.BasicSalary.Value;
            if (req.HousingAllowance.HasValue) emp.HousingAllowance = req.HousingAllowance.Value;
            if (req.TransportAllowance.HasValue) emp.TransportAllowance = req.TransportAllowance.Value;
            if (req.OtherAllowance.HasValue) emp.OtherAllowance = req.OtherAllowance.Value;
            if (req.DeviceUserId != null) emp.DeviceUserId = req.DeviceUserId;
            if (req.BankName != null) emp.BankName = req.BankName;
            if (req.BankAccount != null) emp.BankAccount = req.BankAccount;
            if (req.IBAN != null) emp.IBAN = req.IBAN;
            if (req.IsActive.HasValue) emp.IsActive = req.IsActive.Value;

            _uow.Repository<Employee>().Update(emp);
            await _uow.SaveChangesAsync();
            return Result<EmployeeDetailDto>.Success(MapDetail(emp), "تم تحديث بيانات الموظف");
        }
        catch (Exception ex) { return Result<EmployeeDetailDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var emp = await _uow.Repository<Employee>().Query()
                .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
            if (emp is null) return Result<bool>.Failure("الموظف غير موجود");
            emp.IsDeleted = true; emp.IsActive = false;
            _uow.Repository<Employee>().Update(emp);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف الموظف");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    private static EmployeeDetailDto MapDetail(Employee e) => new(
        e.Id, e.Name, e.Phone, e.Email, e.NationalId, e.Position, e.Department,
        e.BasicSalary, e.HousingAllowance, e.TransportAllowance, e.OtherAllowance,
        e.DeviceUserId, e.BankName, e.BankAccount, e.IBAN,
        e.HireDate, e.TerminationDate, e.IsActive,
        e.UserId, e.User?.Username,
        e.SalaryConfigs?.Where(s => !s.IsDeleted).Select(s =>
            new SalaryConfigDto(s.Id, s.EmployeeId, e.Name, s.ItemName, s.ItemType, s.Amount, s.IsPercentage, s.IsActive, s.Notes)
        ).ToList() ?? new());
}

// ════════════════════════════════════════════════════════════════
// HR: Salary Config Service
// ════════════════════════════════════════════════════════════════

