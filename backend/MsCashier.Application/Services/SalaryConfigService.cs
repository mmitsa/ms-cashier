using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// HR: Salary Config Service
// ════════════════════════════════════════════════════════════════

public class SalaryConfigService : ISalaryConfigService
{
    private readonly IUnitOfWork _uow;
    public SalaryConfigService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<List<SalaryConfigDto>>> GetByEmployeeAsync(int employeeId)
    {
        try
        {
            var configs = await _uow.Repository<SalaryConfig>().Query()
                .Include(s => s.Employee)
                .Where(s => s.EmployeeId == employeeId && !s.IsDeleted)
                .OrderBy(s => s.ItemType).ThenBy(s => s.ItemName)
                .ToListAsync();
            return Result<List<SalaryConfigDto>>.Success(configs.Select(c =>
                new SalaryConfigDto(c.Id, c.EmployeeId, c.Employee?.Name ?? "", c.ItemName,
                    c.ItemType, c.Amount, c.IsPercentage, c.IsActive, c.Notes)).ToList());
        }
        catch (Exception ex) { return Result<List<SalaryConfigDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<SalaryConfigDto>> SaveAsync(int? id, SaveSalaryConfigRequest req)
    {
        try
        {
            SalaryConfig config;
            if (id.HasValue)
            {
                config = await _uow.Repository<SalaryConfig>().Query()
                    .FirstOrDefaultAsync(s => s.Id == id.Value && !s.IsDeleted)
                    ?? throw new Exception("البند غير موجود");
                config.ItemName = req.ItemName; config.ItemType = req.ItemType;
                config.Amount = req.Amount; config.IsPercentage = req.IsPercentage;
                config.Notes = req.Notes;
                _uow.Repository<SalaryConfig>().Update(config);
            }
            else
            {
                config = new SalaryConfig
                {
                    EmployeeId = req.EmployeeId, ItemName = req.ItemName,
                    ItemType = req.ItemType, Amount = req.Amount,
                    IsPercentage = req.IsPercentage, IsActive = true, Notes = req.Notes
                };
                await _uow.Repository<SalaryConfig>().AddAsync(config);
            }
            await _uow.SaveChangesAsync();
            var emp = await _uow.Repository<Employee>().Query().FirstOrDefaultAsync(e => e.Id == config.EmployeeId);
            return Result<SalaryConfigDto>.Success(new SalaryConfigDto(
                config.Id, config.EmployeeId, emp?.Name ?? "", config.ItemName,
                config.ItemType, config.Amount, config.IsPercentage, config.IsActive, config.Notes),
                id.HasValue ? "تم تحديث البند" : "تم إضافة البند");
        }
        catch (Exception ex) { return Result<SalaryConfigDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var config = await _uow.Repository<SalaryConfig>().Query()
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
            if (config is null) return Result<bool>.Failure("البند غير موجود");
            config.IsDeleted = true;
            _uow.Repository<SalaryConfig>().Update(config);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف البند");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }
}

// ════════════════════════════════════════════════════════════════
// HR: Attendance Device Service
// ════════════════════════════════════════════════════════════════

