using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Application.Services.Accounting.Posting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// HR: Payroll Management Service
// ════════════════════════════════════════════════════════════════

public class PayrollManagementService : IPayrollService
{
    private readonly IUnitOfWork _uow;
    private readonly IAttendanceService _attendanceService;
    private readonly ICurrentTenantService _tenantService;
    private readonly IPayrollPostingService _payrollPostingService;
    public PayrollManagementService(IUnitOfWork uow, IAttendanceService att, ICurrentTenantService tenant, IPayrollPostingService payrollPostingService)
    { _uow = uow; _attendanceService = att; _tenantService = tenant; _payrollPostingService = payrollPostingService; }

    public async Task<Result<List<PayrollDetailDto>>> GeneratePayrollAsync(GeneratePayrollRequest req)
    {
        try
        {
            var empQuery = _uow.Repository<Employee>().Query()
                .Include(e => e.SalaryConfigs.Where(s => !s.IsDeleted && s.IsActive))
                .Where(e => !e.IsDeleted && e.IsActive);
            if (req.EmployeeIds?.Any() == true)
                empQuery = empQuery.Where(e => req.EmployeeIds.Contains(e.Id));
            var employees = await empQuery.ToListAsync();

            var existingPayrolls = await _uow.Repository<Payroll>().Query()
                .Where(p => p.Month == req.Month && p.Year == req.Year && p.TenantId == _tenantService.TenantId)
                .Select(p => p.EmployeeId).ToListAsync();

            var attendanceSummary = await _attendanceService.GetMonthSummaryAsync(req.Month, req.Year, null);
            var attMap = attendanceSummary.IsSuccess
                ? attendanceSummary.Data!.ToDictionary(a => a.EmployeeId) : new();

            foreach (var emp in employees)
            {
                if (existingPayrolls.Contains(emp.Id)) continue;
                attMap.TryGetValue(emp.Id, out var att);

                decimal basicSalary = emp.BasicSalary;
                decimal allowances = emp.HousingAllowance + emp.TransportAllowance + emp.OtherAllowance;
                decimal deductions = 0, bonus = 0, overtime = 0, penalty = 0;
                var items = new List<PayrollItem>();

                if (emp.HousingAllowance > 0)
                    items.Add(new PayrollItem { ItemName = "بدل سكن", ItemType = PayrollItemType.Allowance, Amount = emp.HousingAllowance });
                if (emp.TransportAllowance > 0)
                    items.Add(new PayrollItem { ItemName = "بدل نقل", ItemType = PayrollItemType.Allowance, Amount = emp.TransportAllowance });
                if (emp.OtherAllowance > 0)
                    items.Add(new PayrollItem { ItemName = "بدلات أخرى", ItemType = PayrollItemType.Allowance, Amount = emp.OtherAllowance });

                foreach (var sc in emp.SalaryConfigs)
                {
                    decimal amount = sc.IsPercentage ? basicSalary * sc.Amount / 100 : sc.Amount;
                    items.Add(new PayrollItem { ItemName = sc.ItemName, ItemType = sc.ItemType, Amount = amount });
                    switch (sc.ItemType)
                    {
                        case PayrollItemType.Allowance: allowances += amount; break;
                        case PayrollItemType.Deduction: deductions += amount; break;
                        case PayrollItemType.Bonus: bonus += amount; break;
                        case PayrollItemType.Overtime: overtime += amount; break;
                        case PayrollItemType.Penalty: penalty += amount; break;
                    }
                }

                if (att != null && att.AbsentDays > 0 && att.WorkingDays > 0)
                {
                    decimal dailyRate = basicSalary / att.WorkingDays;
                    decimal absentDeduction = dailyRate * att.AbsentDays;
                    deductions += absentDeduction;
                    items.Add(new PayrollItem { ItemName = $"خصم غياب ({att.AbsentDays} يوم)", ItemType = PayrollItemType.Deduction, Amount = absentDeduction });
                }

                decimal netSalary = basicSalary + allowances + bonus + overtime - deductions - penalty;
                var payroll = new Payroll
                {
                    TenantId = _tenantService.TenantId, EmployeeId = emp.Id,
                    Month = req.Month, Year = req.Year,
                    WorkingDays = att?.WorkingDays ?? 30, PresentDays = att?.PresentDays ?? 0,
                    AbsentDays = att?.AbsentDays ?? 0, LateDays = att?.LateDays ?? 0,
                    LeaveDays = att?.LeaveDays ?? 0,
                    BasicSalary = basicSalary, Allowances = allowances, Deductions = deductions,
                    Bonus = bonus, OvertimeAmount = overtime, PenaltyAmount = penalty,
                    NetSalary = netSalary, Status = PayrollStatus.Draft, Items = items
                };
                await _uow.Repository<Payroll>().AddAsync(payroll);
            }
            await _uow.SaveChangesAsync();

            var payrolls = await _uow.Repository<Payroll>().Query()
                .Include(p => p.Employee).Include(p => p.Items).Include(p => p.Checks)
                .Where(p => p.Month == req.Month && p.Year == req.Year && p.TenantId == _tenantService.TenantId)
                .ToListAsync();

            return Result<List<PayrollDetailDto>>.Success(
                payrolls.Select(MapPayroll).ToList(),
                $"تم إنشاء كشف رواتب {payrolls.Count} موظف لشهر {req.Month}/{req.Year}");
        }
        catch (Exception ex) { return Result<List<PayrollDetailDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> ApprovePayrollAsync(ApprovePayrollRequest req, Guid approvedBy)
    {
        try
        {
            var payrolls = await _uow.Repository<Payroll>().Query()
                .Where(p => req.PayrollIds.Contains(p.Id) && p.Status == PayrollStatus.Draft)
                .ToListAsync();
            foreach (var p in payrolls)
            {
                p.Status = PayrollStatus.Approved;
                p.ApprovedBy = approvedBy;
                p.ApprovedAt = DateTime.UtcNow;
                _uow.Repository<Payroll>().Update(p);
            }
            await _uow.SaveChangesAsync();

            // Post GL journal per approved payroll. Idempotency risk: engine does not enforce SourceType="Payroll"+SourceId uniqueness, so re-approval could double-post.
            foreach (var p in payrolls)
            {
                var postResult = await _payrollPostingService.PostPayrollRunAsync(p.Id);
                if (!postResult.IsSuccess)
                {
                    // TODO: retry posting (e.g., enqueue background job) — payroll approval is not rolled back on posting failure.
                    Console.Error.WriteLine($"[PayrollPosting] Failed to post payroll {p.Id}: {postResult.Message}");
                }
            }

            return Result<bool>.Success(true, $"تم اعتماد {payrolls.Count} كشف راتب");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PayrollCheckDto>> PayPayrollAsync(PayPayrollRequest req, Guid issuedBy)
    {
        try
        {
            var payroll = await _uow.Repository<Payroll>().Query()
                .FirstOrDefaultAsync(p => p.Id == req.PayrollId && p.Status == PayrollStatus.Approved);
            if (payroll is null) return Result<PayrollCheckDto>.Failure("كشف الراتب غير موجود أو غير معتمد");

            var checkNumber = req.CheckNumber ?? $"CHK-{payroll.Year}{payroll.Month:D2}-{payroll.EmployeeId:D4}";
            var check = new PayrollCheck
            {
                PayrollId = payroll.Id, CheckNumber = checkNumber,
                Amount = payroll.NetSalary, IssueDate = DateTime.UtcNow,
                CashDate = req.CashDate, BankName = req.BankName,
                AccountNumber = req.AccountNumber, IsCashed = false,
                Notes = req.Notes, IssuedBy = issuedBy
            };
            await _uow.Repository<PayrollCheck>().AddAsync(check);

            payroll.Status = PayrollStatus.Paid; payroll.IsPaid = true; payroll.PaidDate = DateTime.UtcNow;
            _uow.Repository<Payroll>().Update(payroll);
            await _uow.SaveChangesAsync();

            return Result<PayrollCheckDto>.Success(new PayrollCheckDto(
                check.Id, check.PayrollId, check.CheckNumber, check.Amount,
                check.IssueDate, check.CashDate, check.BankName, check.AccountNumber,
                check.IsCashed, check.Notes), "تم إصدار الشيك بنجاح");
        }
        catch (Exception ex) { return Result<PayrollCheckDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PagedResult<PayrollDetailDto>>> GetPayrollsAsync(PayrollFilterRequest filter)
    {
        try
        {
            var query = _uow.Repository<Payroll>().Query()
                .Include(p => p.Employee).Include(p => p.Items).Include(p => p.Checks)
                .Where(p => p.TenantId == _tenantService.TenantId);

            if (filter.Month.HasValue) query = query.Where(p => p.Month == filter.Month.Value);
            if (filter.Year.HasValue) query = query.Where(p => p.Year == filter.Year.Value);
            if (filter.EmployeeId.HasValue) query = query.Where(p => p.EmployeeId == filter.EmployeeId.Value);
            if (filter.Status.HasValue) query = query.Where(p => p.Status == filter.Status.Value);

            var total = await query.CountAsync();
            var payrolls = await query.OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
                .ThenBy(p => p.Employee!.Name)
                .Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize).ToListAsync();

            return Result<PagedResult<PayrollDetailDto>>.Success(
                new PagedResult<PayrollDetailDto> { Items = payrolls.Select(MapPayroll).ToList(), TotalCount = total, PageNumber = filter.Page, PageSize = filter.PageSize });
        }
        catch (Exception ex) { return Result<PagedResult<PayrollDetailDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PayrollDetailDto>> GetByIdAsync(int id)
    {
        try
        {
            var p = await _uow.Repository<Payroll>().Query()
                .Include(p => p.Employee).Include(p => p.Items).Include(p => p.Checks)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (p is null) return Result<PayrollDetailDto>.Failure("كشف الراتب غير موجود");
            return Result<PayrollDetailDto>.Success(MapPayroll(p));
        }
        catch (Exception ex) { return Result<PayrollDetailDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PayslipDto>> GetPayslipAsync(int payrollId)
    {
        try
        {
            var p = await _uow.Repository<Payroll>().Query()
                .Include(p => p.Employee).Include(p => p.Items).Include(p => p.Checks)
                .FirstOrDefaultAsync(p => p.Id == payrollId);
            if (p is null) return Result<PayslipDto>.Failure("كشف الراتب غير موجود");

            var tenant = await _uow.Repository<Tenant>().Query()
                .FirstOrDefaultAsync(t => t.Id == _tenantService.TenantId);

            var earnings = p.Items.Where(i => i.ItemType == PayrollItemType.Allowance ||
                                               i.ItemType == PayrollItemType.Bonus ||
                                               i.ItemType == PayrollItemType.Overtime)
                .Select(i => new PayslipLineDto(i.ItemName, i.Amount)).ToList();
            earnings.Insert(0, new PayslipLineDto("الراتب الأساسي", p.BasicSalary));

            var deductionItems = p.Items.Where(i => i.ItemType == PayrollItemType.Deduction ||
                                                      i.ItemType == PayrollItemType.Penalty ||
                                                      i.ItemType == PayrollItemType.Advance)
                .Select(i => new PayslipLineDto(i.ItemName, i.Amount)).ToList();

            var lastCheck = p.Checks.OrderByDescending(c => c.IssueDate).FirstOrDefault();

            return Result<PayslipDto>.Success(new PayslipDto(
                tenant?.Name ?? "", tenant?.Address, tenant?.Phone, tenant?.LogoUrl,
                p.Employee?.Name ?? "", p.EmployeeId.ToString(), p.Employee?.Department,
                p.Employee?.Position, p.Employee?.BankName, p.Employee?.BankAccount, p.Employee?.IBAN,
                p.Month, p.Year, p.WorkingDays, p.PresentDays, p.AbsentDays, p.LateDays,
                p.BasicSalary, earnings, deductionItems,
                earnings.Sum(e => e.Amount), deductionItems.Sum(d => d.Amount), p.NetSalary,
                lastCheck?.CheckNumber, p.PaidDate));
        }
        catch (Exception ex) { return Result<PayslipDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<List<PayrollMonthSummaryDto>>> GetMonthlyHistoryAsync(int? year)
    {
        try
        {
            var query = _uow.Repository<Payroll>().Query()
                .Where(p => p.TenantId == _tenantService.TenantId);
            if (year.HasValue) query = query.Where(p => p.Year == year.Value);

            var raw = await query.GroupBy(p => new { p.Month, p.Year })
                .Select(g => new
                {
                    g.Key.Month,
                    g.Key.Year,
                    Count = g.Count(),
                    BasicSalary = g.Sum(p => p.BasicSalary),
                    Allowances = g.Sum(p => p.Allowances),
                    Deductions = g.Sum(p => p.Deductions),
                    Bonus = g.Sum(p => p.Bonus),
                    NetSalary = g.Sum(p => p.NetSalary),
                    Paid = g.Sum(p => p.IsPaid ? 1 : 0),
                    Unpaid = g.Sum(p => p.IsPaid ? 0 : 1),
                })
                .ToListAsync();

            var groups = raw
                .OrderByDescending(s => s.Year).ThenByDescending(s => s.Month)
                .Select(s => new PayrollMonthSummaryDto(
                    s.Month, s.Year, s.Count,
                    s.BasicSalary, s.Allowances, s.Deductions, s.Bonus, s.NetSalary,
                    s.Paid, s.Unpaid))
                .ToList();
            return Result<List<PayrollMonthSummaryDto>>.Success(groups);
        }
        catch (Exception ex) { return Result<List<PayrollMonthSummaryDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeletePayrollAsync(int id)
    {
        try
        {
            var payroll = await _uow.Repository<Payroll>().Query().FirstOrDefaultAsync(p => p.Id == id);
            if (payroll is null) return Result<bool>.Failure("كشف الراتب غير موجود");
            if (payroll.IsPaid) return Result<bool>.Failure("لا يمكن حذف كشف راتب مدفوع");
            _uow.Repository<Payroll>().Remove(payroll);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف كشف الراتب");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    private static PayrollDetailDto MapPayroll(Payroll p) => new(
        p.Id, p.EmployeeId, p.Employee?.Name ?? "", p.Employee?.Department,
        p.Month, p.Year, p.WorkingDays, p.PresentDays, p.AbsentDays, p.LateDays, p.LeaveDays,
        p.BasicSalary, p.Allowances, p.Deductions, p.Bonus,
        p.OvertimeAmount, p.PenaltyAmount, p.NetSalary,
        p.Status, p.IsPaid, p.PaidDate, null, p.ApprovedAt, p.Notes, p.CreatedAt,
        p.Items.Select(i => new PayrollItemDto(i.Id, i.ItemName, i.ItemType, i.Amount, i.Notes)).ToList(),
        p.Checks.Select(c => new PayrollCheckDto(c.Id, c.PayrollId, c.CheckNumber, c.Amount,
            c.IssueDate, c.CashDate, c.BankName, c.AccountNumber, c.IsCashed, c.Notes)).ToList());
}

// ============================================================
// Branch Management Service
// ============================================================

