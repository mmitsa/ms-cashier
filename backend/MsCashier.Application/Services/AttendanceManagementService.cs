using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// HR: Attendance Management Service
// ════════════════════════════════════════════════════════════════

public class AttendanceManagementService : IAttendanceService
{
    private readonly IUnitOfWork _uow;
    public AttendanceManagementService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<AttendancePunchDto>> ManualPunchAsync(ManualPunchRequest req)
    {
        try
        {
            var emp = await _uow.Repository<Employee>().Query()
                .FirstOrDefaultAsync(e => e.Id == req.EmployeeId && !e.IsDeleted);
            if (emp is null) return Result<AttendancePunchDto>.Failure("الموظف غير موجود");

            var punch = new AttendancePunch
            {
                EmployeeId = req.EmployeeId, PunchTime = req.PunchTime,
                IsCheckIn = req.IsCheckIn, Source = AttendancePunchSource.Manual,
                Notes = req.Notes
            };
            await _uow.Repository<AttendancePunch>().AddAsync(punch);
            await _uow.SaveChangesAsync();

            return Result<AttendancePunchDto>.Success(new AttendancePunchDto(
                punch.Id, emp.Id, emp.Name, punch.PunchTime, punch.IsCheckIn,
                punch.Source, null, null, punch.Notes), "تم تسجيل البصمة");
        }
        catch (Exception ex) { return Result<AttendancePunchDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PagedResult<AttendanceDailySummaryDto>>> GetDailySummaryAsync(AttendanceFilterRequest filter)
    {
        try
        {
            var dateFrom = filter.DateFrom ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30));
            var dateTo = filter.DateTo ?? DateOnly.FromDateTime(DateTime.UtcNow);

            var punchQuery = _uow.Repository<AttendancePunch>().Query()
                .Include(p => p.Employee).Include(p => p.Device)
                .Where(p => !p.IsDeleted);

            if (filter.EmployeeId.HasValue)
                punchQuery = punchQuery.Where(p => p.EmployeeId == filter.EmployeeId.Value);
            if (!string.IsNullOrEmpty(filter.Department))
                punchQuery = punchQuery.Where(p => p.Employee!.Department == filter.Department);

            var dtFrom = dateFrom.ToDateTime(TimeOnly.MinValue);
            var dtTo = dateTo.ToDateTime(TimeOnly.MaxValue);
            var punches = await punchQuery
                .Where(p => p.PunchTime >= dtFrom && p.PunchTime <= dtTo)
                .OrderBy(p => p.PunchTime).ToListAsync();

            // Group by employee + date
            var grouped = punches.GroupBy(p => new { p.EmployeeId, Date = DateOnly.FromDateTime(p.PunchTime) });

            var summaries = new List<AttendanceDailySummaryDto>();
            foreach (var g in grouped)
            {
                var emp = g.First().Employee!;
                var dayPunches = g.OrderBy(p => p.PunchTime).ToList();
                var firstIn = dayPunches.FirstOrDefault(p => p.IsCheckIn);
                var lastOut = dayPunches.LastOrDefault(p => !p.IsCheckIn);
                TimeOnly? checkIn = firstIn != null ? TimeOnly.FromDateTime(firstIn.PunchTime) : null;
                TimeOnly? checkOut = lastOut != null ? TimeOnly.FromDateTime(lastOut.PunchTime) : null;
                double? totalHours = (checkIn.HasValue && checkOut.HasValue)
                    ? (checkOut.Value.ToTimeSpan() - checkIn.Value.ToTimeSpan()).TotalHours : null;

                var status = AttendanceStatus.Present;
                if (checkIn?.Hour > 9) status = AttendanceStatus.Late;

                summaries.Add(new AttendanceDailySummaryDto(
                    emp.Id, emp.Name, emp.Department, g.Key.Date,
                    checkIn, checkOut, totalHours, status,
                    dayPunches.Select(p => new AttendancePunchDto(
                        p.Id, p.EmployeeId, emp.Name, p.PunchTime, p.IsCheckIn,
                        p.Source, p.DeviceId, p.Device?.Name, p.Notes)).ToList()));
            }

            var ordered = summaries.OrderByDescending(s => s.Date).ThenBy(s => s.EmployeeName).ToList();
            int total = ordered.Count;
            var paged = ordered.Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize).ToList();
            return Result<PagedResult<AttendanceDailySummaryDto>>.Success(
                new PagedResult<AttendanceDailySummaryDto> { Items = paged, TotalCount = total, PageNumber = filter.Page, PageSize = filter.PageSize });
        }
        catch (Exception ex) { return Result<PagedResult<AttendanceDailySummaryDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<List<AttendanceMonthSummaryDto>>> GetMonthSummaryAsync(int month, int year, int? employeeId)
    {
        try
        {
            var startDate = new DateOnly(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);
            int workingDays = 0;
            for (var d = startDate; d <= endDate; d = d.AddDays(1))
                if (d.DayOfWeek != DayOfWeek.Friday && d.DayOfWeek != DayOfWeek.Saturday) workingDays++;

            var empQuery = _uow.Repository<Employee>().Query().Where(e => !e.IsDeleted && e.IsActive);
            if (employeeId.HasValue) empQuery = empQuery.Where(e => e.Id == employeeId.Value);
            var employees = await empQuery.ToListAsync();

            var dtFrom = startDate.ToDateTime(TimeOnly.MinValue);
            var dtTo = endDate.ToDateTime(TimeOnly.MaxValue);
            var punches = await _uow.Repository<AttendancePunch>().Query()
                .Where(p => !p.IsDeleted && p.PunchTime >= dtFrom && p.PunchTime <= dtTo)
                .ToListAsync();

            var summaries = new List<AttendanceMonthSummaryDto>();
            foreach (var emp in employees)
            {
                var empPunches = punches.Where(p => p.EmployeeId == emp.Id).ToList();
                var daysPresent = empPunches.Select(p => DateOnly.FromDateTime(p.PunchTime)).Distinct().Count();
                var daysLate = empPunches.Where(p => p.IsCheckIn && p.PunchTime.Hour > 9)
                    .Select(p => DateOnly.FromDateTime(p.PunchTime)).Distinct().Count();

                double totalHours = 0;
                var dayGroups = empPunches.GroupBy(p => DateOnly.FromDateTime(p.PunchTime));
                foreach (var dg in dayGroups)
                {
                    var firstIn = dg.Where(p => p.IsCheckIn).MinBy(p => p.PunchTime);
                    var lastOut = dg.Where(p => !p.IsCheckIn).MaxBy(p => p.PunchTime);
                    if (firstIn != null && lastOut != null)
                        totalHours += (lastOut.PunchTime - firstIn.PunchTime).TotalHours;
                }

                summaries.Add(new AttendanceMonthSummaryDto(
                    emp.Id, emp.Name, emp.Department, month, year,
                    workingDays, daysPresent, workingDays - daysPresent, daysLate, 0, totalHours));
            }
            return Result<List<AttendanceMonthSummaryDto>>.Success(summaries);
        }
        catch (Exception ex) { return Result<List<AttendanceMonthSummaryDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<List<AttendancePunchDto>>> GetPunchesAsync(int employeeId, DateOnly dateFrom, DateOnly dateTo)
    {
        try
        {
            var dtFrom = dateFrom.ToDateTime(TimeOnly.MinValue);
            var dtTo = dateTo.ToDateTime(TimeOnly.MaxValue);
            var punches = await _uow.Repository<AttendancePunch>().Query()
                .Include(p => p.Employee).Include(p => p.Device)
                .Where(p => !p.IsDeleted && p.EmployeeId == employeeId &&
                            p.PunchTime >= dtFrom && p.PunchTime <= dtTo)
                .OrderBy(p => p.PunchTime).ToListAsync();
            return Result<List<AttendancePunchDto>>.Success(punches.Select(p => new AttendancePunchDto(
                p.Id, p.EmployeeId, p.Employee?.Name ?? "", p.PunchTime, p.IsCheckIn,
                p.Source, p.DeviceId, p.Device?.Name, p.Notes)).ToList());
        }
        catch (Exception ex) { return Result<List<AttendancePunchDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeletePunchAsync(long punchId)
    {
        try
        {
            var punch = await _uow.Repository<AttendancePunch>().Query()
                .FirstOrDefaultAsync(p => p.Id == punchId && !p.IsDeleted);
            if (punch is null) return Result<bool>.Failure("السجل غير موجود");
            punch.IsDeleted = true;
            _uow.Repository<AttendancePunch>().Update(punch);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف السجل");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }
}

// ════════════════════════════════════════════════════════════════
// HR: Payroll Management Service
// ════════════════════════════════════════════════════════════════

