using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// Cashier Shift Service — افتتاح/إغلاق ورديات الكاشير
// ════════════════════════════════════════════════════════════════

public class CashierShiftService : ICashierShiftService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public CashierShiftService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<CashierShiftDto>> OpenShiftAsync(OpenShiftRequest request)
    {
        try
        {
            var userId = _tenant.UserId;

            var existingOpen = await _uow.Repository<CashierShift>().Query()
                .AnyAsync(s => s.UserId == userId && s.Status == CashierShiftStatus.Open && !s.IsDeleted);
            if (existingOpen)
                return Result<CashierShiftDto>.Failure("يوجد وردية مفتوحة بالفعل، يجب إغلاقها أولاً");

            if (request.OpeningCash < 0)
                return Result<CashierShiftDto>.Failure("المبلغ الافتتاحي لا يمكن أن يكون سالباً");

            var shift = new CashierShift
            {
                TenantId = _tenant.TenantId,
                UserId = userId,
                WarehouseId = request.WarehouseId,
                OpenedAt = DateTime.UtcNow,
                OpeningCash = request.OpeningCash,
                OpeningNotes = request.Notes,
                Status = CashierShiftStatus.Open
            };

            await _uow.Repository<CashierShift>().AddAsync(shift);
            await _uow.SaveChangesAsync();

            var dto = await LoadDtoAsync(shift.Id);
            return dto is null
                ? Result<CashierShiftDto>.Failure("تعذر تحميل الوردية")
                : Result<CashierShiftDto>.Success(dto, "تم افتتاح الوردية");
        }
        catch (Exception ex)
        {
            return Result<CashierShiftDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<CashierShiftDto?>> GetCurrentShiftAsync()
    {
        try
        {
            var userId = _tenant.UserId;
            var shift = await _uow.Repository<CashierShift>().Query()
                .Where(s => s.UserId == userId && s.Status == CashierShiftStatus.Open && !s.IsDeleted)
                .OrderByDescending(s => s.OpenedAt)
                .FirstOrDefaultAsync();

            if (shift is null)
                return Result<CashierShiftDto?>.Success(null);

            var dto = await LoadDtoAsync(shift.Id);
            return Result<CashierShiftDto?>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<CashierShiftDto?>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ShiftSummaryDto>> GetShiftSummaryAsync(int shiftId)
    {
        try
        {
            var shift = await _uow.Repository<CashierShift>().Query()
                .FirstOrDefaultAsync(s => s.Id == shiftId && !s.IsDeleted);
            if (shift is null)
                return Result<ShiftSummaryDto>.Failure("الوردية غير موجودة");

            var summary = await BuildSummaryAsync(shift);
            return Result<ShiftSummaryDto>.Success(summary);
        }
        catch (Exception ex)
        {
            return Result<ShiftSummaryDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<CashierShiftDto>> CloseShiftAsync(CloseShiftRequest request)
    {
        try
        {
            var userId = _tenant.UserId;
            var shift = await _uow.Repository<CashierShift>().Query()
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == CashierShiftStatus.Open && !s.IsDeleted);
            if (shift is null)
                return Result<CashierShiftDto>.Failure("لا توجد وردية مفتوحة للإغلاق");

            var summary = await BuildSummaryAsync(shift);

            shift.TotalSales = summary.TotalSales;
            shift.TotalCashSales = summary.TotalCashSales;
            shift.TotalCardSales = summary.TotalCardSales;
            shift.InvoiceCount = summary.InvoiceCount;
            shift.ExpectedCash = summary.ExpectedCash;
            shift.ActualCash = request.ActualCash;
            shift.CashDifference = request.ActualCash - summary.ExpectedCash;
            shift.ClosingNotes = request.Notes;
            shift.Status = CashierShiftStatus.Closed;
            shift.ClosedAt = DateTime.UtcNow;
            shift.UpdatedAt = DateTime.UtcNow;

            _uow.Repository<CashierShift>().Update(shift);
            await _uow.SaveChangesAsync();

            var dto = await LoadDtoAsync(shift.Id);
            return dto is null
                ? Result<CashierShiftDto>.Failure("تعذر تحميل الوردية")
                : Result<CashierShiftDto>.Success(dto, "تم إغلاق الوردية");
        }
        catch (Exception ex)
        {
            return Result<CashierShiftDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<CashierShiftDto>> ForceCloseAsync(int shiftId, string reason)
    {
        try
        {
            var shift = await _uow.Repository<CashierShift>().Query()
                .FirstOrDefaultAsync(s => s.Id == shiftId && !s.IsDeleted);
            if (shift is null)
                return Result<CashierShiftDto>.Failure("الوردية غير موجودة");
            if (shift.Status != CashierShiftStatus.Open)
                return Result<CashierShiftDto>.Failure("الوردية ليست مفتوحة");

            var summary = await BuildSummaryAsync(shift);

            shift.TotalSales = summary.TotalSales;
            shift.TotalCashSales = summary.TotalCashSales;
            shift.TotalCardSales = summary.TotalCardSales;
            shift.InvoiceCount = summary.InvoiceCount;
            shift.ExpectedCash = summary.ExpectedCash;
            shift.ClosingNotes = $"[إغلاق إجباري] {reason}";
            shift.Status = CashierShiftStatus.ForceClosed;
            shift.ClosedAt = DateTime.UtcNow;
            shift.UpdatedAt = DateTime.UtcNow;

            _uow.Repository<CashierShift>().Update(shift);
            await _uow.SaveChangesAsync();

            var dto = await LoadDtoAsync(shift.Id);
            return dto is null
                ? Result<CashierShiftDto>.Failure("تعذر تحميل الوردية")
                : Result<CashierShiftDto>.Success(dto, "تم إغلاق الوردية إجبارياً");
        }
        catch (Exception ex)
        {
            return Result<CashierShiftDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<CashierShiftDto>>> ListShiftsAsync(ShiftListFilter filter)
    {
        try
        {
            var page = filter.Page < 1 ? 1 : filter.Page;
            var pageSize = filter.PageSize < 1 ? 20 : filter.PageSize;

            var role = _tenant.Role;
            var currentUserId = _tenant.UserId;
            var isAdmin = role == "SuperAdmin" || role == "Admin";

            var query = _uow.Repository<CashierShift>().Query().Where(s => !s.IsDeleted);

            if (!isAdmin)
                query = query.Where(s => s.UserId == currentUserId);
            else if (filter.UserId.HasValue)
                query = query.Where(s => s.UserId == filter.UserId.Value);

            if (filter.Status.HasValue)
                query = query.Where(s => s.Status == filter.Status.Value);
            if (filter.DateFrom.HasValue)
                query = query.Where(s => s.OpenedAt >= filter.DateFrom.Value);
            if (filter.DateTo.HasValue)
                query = query.Where(s => s.OpenedAt <= filter.DateTo.Value);

            var total = await query.CountAsync();
            var shifts = await query
                .OrderByDescending(s => s.OpenedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var userIds = shifts.Select(s => s.UserId).Distinct().ToList();
            var warehouseIds = shifts.Where(s => s.WarehouseId.HasValue).Select(s => s.WarehouseId!.Value).Distinct().ToList();

            var users = await _uow.Repository<User>().Query()
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName })
                .ToListAsync();
            var warehouses = await _uow.Repository<Warehouse>().Query()
                .Where(w => warehouseIds.Contains(w.Id))
                .Select(w => new { w.Id, w.Name })
                .ToListAsync();

            var items = shifts.Select(s => ToDto(s,
                users.FirstOrDefault(u => u.Id == s.UserId)?.FullName,
                s.WarehouseId.HasValue ? warehouses.FirstOrDefault(w => w.Id == s.WarehouseId)?.Name : null
            )).ToList();

            return Result<PagedResult<CashierShiftDto>>.Success(new PagedResult<CashierShiftDto>
            {
                Items = items,
                TotalCount = total,
                PageNumber = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            return Result<PagedResult<CashierShiftDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────

    private async Task<ShiftSummaryDto> BuildSummaryAsync(CashierShift shift)
    {
        var now = DateTime.UtcNow;

        var invoiceQuery = _uow.Repository<Invoice>().Query()
            .Where(i => !i.IsDeleted
                && i.CreatedBy == shift.UserId
                && i.CreatedAt >= shift.OpenedAt
                && i.CreatedAt <= now);

        var invoices = await invoiceQuery
            .Select(i => new { i.TotalAmount, i.PaidAmount, i.PaymentMethod })
            .ToListAsync();

        var totalSales = invoices.Sum(i => i.TotalAmount);
        var totalCashSales = invoices
            .Where(i => i.PaymentMethod == PaymentMethod.Cash)
            .Sum(i => i.PaidAmount);
        var totalCardSales = invoices
            .Where(i => i.PaymentMethod == PaymentMethod.Visa || i.PaymentMethod == PaymentMethod.Instapay)
            .Sum(i => i.PaidAmount);
        var invoiceCount = invoices.Count;
        var expectedCash = shift.OpeningCash + totalCashSales;

        string? userName = await _uow.Repository<User>().Query()
            .Where(u => u.Id == shift.UserId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync();

        return new ShiftSummaryDto(
            shift.Id,
            shift.UserId,
            userName,
            shift.OpenedAt,
            shift.OpeningCash,
            totalSales,
            totalCashSales,
            totalCardSales,
            expectedCash,
            shift.ActualCash,
            shift.ActualCash.HasValue ? shift.ActualCash.Value - expectedCash : null,
            invoiceCount
        );
    }

    private async Task<CashierShiftDto?> LoadDtoAsync(int shiftId)
    {
        var shift = await _uow.Repository<CashierShift>().Query()
            .FirstOrDefaultAsync(s => s.Id == shiftId && !s.IsDeleted);
        if (shift is null) return null;

        var userName = await _uow.Repository<User>().Query()
            .Where(u => u.Id == shift.UserId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync();

        string? warehouseName = null;
        if (shift.WarehouseId.HasValue)
        {
            warehouseName = await _uow.Repository<Warehouse>().Query()
                .Where(w => w.Id == shift.WarehouseId.Value)
                .Select(w => w.Name)
                .FirstOrDefaultAsync();
        }

        return ToDto(shift, userName, warehouseName);
    }

    private static CashierShiftDto ToDto(CashierShift s, string? userName, string? warehouseName)
        => new(
            s.Id,
            s.UserId,
            userName,
            s.WarehouseId,
            warehouseName,
            s.OpenedAt,
            s.ClosedAt,
            s.OpeningCash,
            s.ExpectedCash,
            s.ActualCash,
            s.CashDifference,
            s.TotalSales,
            s.TotalCashSales,
            s.TotalCardSales,
            s.InvoiceCount,
            s.OpeningNotes,
            s.ClosingNotes,
            s.Status
        );
}
