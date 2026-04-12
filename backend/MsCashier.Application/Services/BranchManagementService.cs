using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ============================================================
// Branch Management Service
// ============================================================

public class BranchManagementService : IBranchService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _ts;

    public BranchManagementService(IUnitOfWork uow, ICurrentTenantService ts)
    {
        _uow = uow;
        _ts = ts;
    }

    // Helper: get tenant with plan
    private async Task<Tenant?> GetTenantWithPlan()
    {
        return await _uow.Repository<Tenant>().Query()
            .Include(t => t.Plan)
            .FirstOrDefaultAsync(t => t.Id == _ts.TenantId);
    }

    // ---- Tenant-side ----

    public async Task<Result<List<BranchDto>>> GetBranchesAsync()
    {
        var branches = await _uow.Repository<Branch>().Query()
            .Include(b => b.Warehouses)
            .OrderBy(b => b.IsMainBranch ? 0 : 1).ThenBy(b => b.Name)
            .ToListAsync();
        return Result<List<BranchDto>>.Success(branches.Select(MapBranch).ToList());
    }

    public async Task<Result<BranchDto>> GetBranchByIdAsync(int id)
    {
        var branch = await _uow.Repository<Branch>().Query()
            .Include(b => b.Warehouses)
            .FirstOrDefaultAsync(b => b.Id == id);
        if (branch == null) return Result<BranchDto>.Failure("الفرع غير موجود");
        return Result<BranchDto>.Success(MapBranch(branch));
    }

    public async Task<Result<BranchSummaryDto>> GetSummaryAsync()
    {
        var tenant = await GetTenantWithPlan();
        if (tenant == null) return Result<BranchSummaryDto>.Failure("المتجر غير موجود");

        var branches = await _uow.Repository<Branch>().Query().ToListAsync();
        var activeBranches = branches.Count(b => b.Status == BranchStatus.Active);
        var totalFees = branches.Where(b => b.Status == BranchStatus.Active).Sum(b => b.MonthlyFee);
        var unitPrice = tenant.Plan?.BranchMonthlyPrice ?? 0;
        var max = tenant.Plan?.MaxBranches ?? 0;

        return Result<BranchSummaryDto>.Success(new BranchSummaryDto(
            branches.Count, activeBranches, max, totalFees, unitPrice));
    }

    public async Task<Result<BranchPlanInfoDto>> GetPlanInfoAsync()
    {
        var tenant = await GetTenantWithPlan();
        if (tenant?.Plan == null) return Result<BranchPlanInfoDto>.Failure("لا توجد باقة مفعلة");

        var currentCount = await _uow.Repository<Branch>().Query().CountAsync();
        var plan = tenant.Plan;

        return Result<BranchPlanInfoDto>.Success(new BranchPlanInfoDto(
            plan.Id, plan.Name, plan.MaxBranches, currentCount,
            plan.BranchMonthlyPrice, plan.BranchYearlyPrice,
            currentCount < plan.MaxBranches));
    }

    public async Task<Result<BranchDto>> UpdateBranchAsync(int id, UpdateBranchDto dto)
    {
        var branch = await _uow.Repository<Branch>().Query()
            .Include(b => b.Warehouses)
            .FirstOrDefaultAsync(b => b.Id == id);
        if (branch == null) return Result<BranchDto>.Failure("الفرع غير موجود");

        branch.Name = dto.Name;
        branch.Address = dto.Address;
        branch.City = dto.City;
        branch.Phone = dto.Phone;
        branch.Email = dto.Email;
        branch.ManagerName = dto.ManagerName;
        branch.Notes = dto.Notes;

        await _uow.SaveChangesAsync();
        return Result<BranchDto>.Success(MapBranch(branch));
    }

    public async Task<Result<bool>> SuspendBranchAsync(int id)
    {
        var branch = await _uow.Repository<Branch>().GetByIdAsync(id);
        if (branch == null) return Result<bool>.Failure("الفرع غير موجود");
        if (branch.IsMainBranch) return Result<bool>.Failure("لا يمكن تعليق الفرع الرئيسي");

        branch.Status = BranchStatus.Suspended;
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ActivateBranchAsync(int id)
    {
        var branch = await _uow.Repository<Branch>().GetByIdAsync(id);
        if (branch == null) return Result<bool>.Failure("الفرع غير موجود");

        branch.Status = BranchStatus.Active;
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> AssignWarehouseAsync(AssignWarehouseToBranchDto dto)
    {
        var warehouse = await _uow.Repository<Warehouse>().GetByIdAsync(dto.WarehouseId);
        if (warehouse == null) return Result<bool>.Failure("المخزن غير موجود");

        var branch = await _uow.Repository<Branch>().GetByIdAsync(dto.BranchId);
        if (branch == null) return Result<bool>.Failure("الفرع غير موجود");

        var tenant = await GetTenantWithPlan();
        var maxWh = tenant?.Plan?.MaxWarehouses ?? tenant?.MaxWarehouses ?? 5;
        var totalWh = await _uow.Repository<Warehouse>().Query().CountAsync();
        if (totalWh > maxWh) return Result<bool>.Failure($"تم تجاوز الحد الأقصى للمخازن ({maxWh})");

        warehouse.BranchId = dto.BranchId;
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> UnassignWarehouseAsync(int warehouseId)
    {
        var warehouse = await _uow.Repository<Warehouse>().GetByIdAsync(warehouseId);
        if (warehouse == null) return Result<bool>.Failure("المخزن غير موجود");

        warehouse.BranchId = null;
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ---- Branch Requests (tenant-side) ----

    public async Task<Result<BranchRequestDto>> CreateBranchRequestAsync(CreateBranchRequestDto dto)
    {
        var tenant = await GetTenantWithPlan();
        if (tenant?.Plan == null) return Result<BranchRequestDto>.Failure("لا توجد باقة مفعلة");

        var currentBranches = await _uow.Repository<Branch>().Query().CountAsync();
        if (currentBranches >= tenant.Plan.MaxBranches)
            return Result<BranchRequestDto>.Failure($"تم الوصول للحد الأقصى من الفروع ({tenant.Plan.MaxBranches}). يرجى ترقية الباقة.");

        var pendingCount = await _uow.Repository<BranchRequest>().Query()
            .CountAsync(r => r.Status == BranchRequestStatus.Pending || r.Status == BranchRequestStatus.AwaitingPayment);
        if (pendingCount > 0)
            return Result<BranchRequestDto>.Failure("يوجد طلب فرع قيد المراجعة بالفعل");

        var dataMode = Enum.TryParse<BranchDataMode>(dto.DataMode, out var dm) ? dm : BranchDataMode.SharedCatalog;

        var request = new BranchRequest
        {
            BranchName = dto.BranchName,
            Address = dto.Address,
            City = dto.City,
            Phone = dto.Phone,
            ManagerName = dto.ManagerName,
            DataMode = dataMode,
            RequestedFee = tenant.Plan.BranchMonthlyPrice,
            Notes = dto.Notes,
            Status = BranchRequestStatus.Pending
        };

        await _uow.Repository<BranchRequest>().AddAsync(request);
        await _uow.SaveChangesAsync();

        return Result<BranchRequestDto>.Success(MapRequest(request, tenant.Name));
    }

    public async Task<Result<List<BranchRequestDto>>> GetMyRequestsAsync()
    {
        var tenant = await _uow.Repository<Tenant>().Query()
            .FirstOrDefaultAsync(t => t.Id == _ts.TenantId);
        var requests = await _uow.Repository<BranchRequest>().Query()
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return Result<List<BranchRequestDto>>.Success(requests.Select(r => MapRequest(r, tenant?.Name)).ToList());
    }

    public async Task<Result<BranchRequestDto>> RecordPaymentAsync(int requestId, BranchPaymentDto dto)
    {
        var request = await _uow.Repository<BranchRequest>().GetByIdAsync(requestId);
        if (request == null) return Result<BranchRequestDto>.Failure("الطلب غير موجود");
        if (request.Status != BranchRequestStatus.AwaitingPayment)
            return Result<BranchRequestDto>.Failure("الطلب ليس في حالة انتظار الدفع");

        request.PaymentReference = dto.PaymentReference;
        request.PaidAt = DateTime.UtcNow;
        request.Status = BranchRequestStatus.Paid;

        await _uow.SaveChangesAsync();

        // Auto-activate after payment
        return await ActivateAfterPaymentAsync(requestId);
    }

    // ---- Admin-side ----

    public async Task<Result<PagedResult<BranchRequestDto>>> GetAllRequestsAsync(int page, int size, string? status)
    {
        // SuperAdmin sees all tenants; Admin sees only their own tenant
        var isSuperAdmin = _ts.Role == "SuperAdmin";
        var query = isSuperAdmin
            ? _uow.Repository<BranchRequest>().QueryUnfiltered()
            : _uow.Repository<BranchRequest>().Query();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<BranchRequestStatus>(status, out var s))
            query = query.Where(r => r.Status == s);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * size).Take(size)
            .ToListAsync();

        // Fetch tenant names
        var tenantIds = items.Select(i => i.TenantId).Distinct().ToList();
        var tenants = await _uow.Repository<Tenant>().Query()
            .Where(t => tenantIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.Name);

        var dtos = items.Select(r => MapRequest(r, tenants.GetValueOrDefault(r.TenantId))).ToList();

        return Result<PagedResult<BranchRequestDto>>.Success(new PagedResult<BranchRequestDto>
        {
            Items = dtos, TotalCount = total, PageNumber = page, PageSize = size
        });
    }

    public async Task<Result<BranchRequestDto>> ReviewRequestAsync(int requestId, AdminReviewBranchRequestDto dto)
    {
        var isSuperAdmin = _ts.Role == "SuperAdmin";
        var request = isSuperAdmin
            ? await _uow.Repository<BranchRequest>().QueryUnfiltered().FirstOrDefaultAsync(r => r.Id == requestId)
            : await _uow.Repository<BranchRequest>().Query().FirstOrDefaultAsync(r => r.Id == requestId);
        if (request == null) return Result<BranchRequestDto>.Failure("الطلب غير موجود");
        if (request.Status != BranchRequestStatus.Pending)
            return Result<BranchRequestDto>.Failure("لا يمكن مراجعة هذا الطلب في حالته الحالية");

        request.AdminNotes = dto.AdminNotes;
        request.ReviewedAt = DateTime.UtcNow;

        if (dto.Approve)
        {
            request.Status = BranchRequestStatus.AwaitingPayment;
        }
        else
        {
            request.Status = BranchRequestStatus.Rejected;
        }

        await _uow.SaveChangesAsync();

        var tenantName = (await _uow.Repository<Tenant>().Query()
            .FirstOrDefaultAsync(t => t.Id == request.TenantId))?.Name;
        return Result<BranchRequestDto>.Success(MapRequest(request, tenantName));
    }

    public async Task<Result<BranchRequestDto>> ActivateAfterPaymentAsync(int requestId)
    {
        var isSuperAdmin = _ts.Role == "SuperAdmin";
        var request = isSuperAdmin
            ? await _uow.Repository<BranchRequest>().QueryUnfiltered().FirstOrDefaultAsync(r => r.Id == requestId)
            : await _uow.Repository<BranchRequest>().Query().FirstOrDefaultAsync(r => r.Id == requestId);
        if (request == null) return Result<BranchRequestDto>.Failure("الطلب غير موجود");
        if (request.Status != BranchRequestStatus.Paid)
            return Result<BranchRequestDto>.Failure("لم يتم الدفع بعد");

        // Create the branch
        var branch = new Branch
        {
            TenantId = request.TenantId,
            Name = request.BranchName,
            Address = request.Address,
            City = request.City,
            Phone = request.Phone,
            ManagerName = request.ManagerName,
            DataMode = request.DataMode,
            Status = BranchStatus.Active,
            ActivatedAt = DateTime.UtcNow,
            MonthlyFee = request.RequestedFee,
            IsMainBranch = false
        };

        await _uow.Repository<Branch>().AddAsync(branch);
        await _uow.SaveChangesAsync();

        request.ActivatedBranchId = branch.Id;
        request.Status = BranchRequestStatus.Activated;
        await _uow.SaveChangesAsync();

        var tenantName = (await _uow.Repository<Tenant>().Query()
            .FirstOrDefaultAsync(t => t.Id == request.TenantId))?.Name;
        return Result<BranchRequestDto>.Success(MapRequest(request, tenantName));
    }

    // ---- Mappers ----

    private static BranchDto MapBranch(Branch b) => new(
        b.Id, b.Name, b.Address, b.City, b.Phone, b.Email,
        b.ManagerName, b.DataMode.ToString(), b.Status.ToString(),
        b.ActivatedAt, b.ExpiresAt, b.MonthlyFee,
        b.IsMainBranch, b.Notes, b.Warehouses?.Count ?? 0);

    private static BranchRequestDto MapRequest(BranchRequest r, string? tenantName) => new(
        r.Id, r.TenantId, tenantName,
        r.BranchName, r.Address, r.City, r.Phone,
        r.ManagerName, r.DataMode.ToString(), r.Status.ToString(),
        r.RequestedFee, r.Notes, r.AdminNotes,
        r.ActivatedBranchId, r.PaymentReference,
        r.PaidAt, r.ReviewedAt, r.CreatedAt);
}

// ============================================================
// Table Service
// ============================================================

