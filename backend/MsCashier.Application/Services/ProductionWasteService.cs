using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// ProductionWasteService
// ════════════════════════════════════════════════════════════════

public class ProductionWasteService : IProductionWasteService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public ProductionWasteService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<ProductionWasteDto>> CreateAsync(CreateWasteRequest request)
    {
        try
        {
            var waste = new ProductionWaste
            {
                ProductionOrderId = request.ProductionOrderId,
                WasteType = Enum.Parse<WasteType>(request.WasteType),
                ProductId = request.ProductId,
                Quantity = request.Quantity,
                UnitId = request.UnitId,
                EstimatedCost = request.EstimatedCost ?? 0,
                Reason = request.Reason,
                ReportedByUserId = _tenant.UserId,
                BranchId = request.BranchId
            };

            // Auto-calculate cost if not provided
            if (!request.EstimatedCost.HasValue)
            {
                var product = await _uow.Repository<Product>().GetByIdAsync(request.ProductId);
                if (product != null)
                    waste.EstimatedCost = request.Quantity * product.CostPrice;
            }

            await _uow.Repository<ProductionWaste>().AddAsync(waste);
            await _uow.SaveChangesAsync();

            var dto = await GetWasteDto(waste.Id);
            return Result<ProductionWasteDto>.Success(dto!);
        }
        catch (Exception ex) { return Result<ProductionWasteDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PagedResult<ProductionWasteDto>>> SearchAsync(WasteFilterRequest request)
    {
        try
        {
            var query = _uow.Repository<ProductionWaste>().Query()
                .Include(w => w.Product)
                .Include(w => w.ProductionOrder)
                .Include(w => w.Unit)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.WasteType))
                query = query.Where(w => w.WasteType == Enum.Parse<WasteType>(request.WasteType));
            if (request.ProductId.HasValue)
                query = query.Where(w => w.ProductId == request.ProductId);
            if (request.ProductionOrderId.HasValue)
                query = query.Where(w => w.ProductionOrderId == request.ProductionOrderId);
            if (request.DateFrom.HasValue)
                query = query.Where(w => w.ReportedAt >= request.DateFrom);
            if (request.DateTo.HasValue)
                query = query.Where(w => w.ReportedAt <= request.DateTo);

            var total = await query.CountAsync();
            var items = await query.OrderByDescending(w => w.ReportedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var dtos = items.Select(w => new ProductionWasteDto(
                w.Id, w.ProductionOrderId, w.ProductionOrder?.Code,
                w.WasteType.ToString(), w.ProductId, w.Product?.Name ?? "",
                w.Quantity, w.UnitId, w.Unit?.Name,
                w.EstimatedCost, w.Reason,
                w.ReportedByUserId, null,
                w.ReportedAt, w.BranchId)).ToList();

            return Result<PagedResult<ProductionWasteDto>>.Success(
                new PagedResult<ProductionWasteDto> { Items = dtos, TotalCount = total, PageNumber = request.Page, PageSize = request.PageSize });
        }
        catch (Exception ex) { return Result<PagedResult<ProductionWasteDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<WasteSummaryDto>> GetSummaryAsync(DateTime from, DateTime to, int? branchId)
    {
        try
        {
            var query = _uow.Repository<ProductionWaste>().Query()
                .Include(w => w.Product)
                .Where(w => w.ReportedAt >= from && w.ReportedAt <= to);

            if (branchId.HasValue)
                query = query.Where(w => w.BranchId == branchId);

            var wastes = await query.ToListAsync();

            var byType = wastes.GroupBy(w => w.WasteType).Select(g => new WasteByTypeDto(
                g.Key.ToString(), g.Count(), g.Sum(w => w.Quantity), g.Sum(w => w.EstimatedCost))).ToList();

            var byProduct = wastes.GroupBy(w => new { w.ProductId, Name = w.Product?.Name ?? "" })
                .OrderByDescending(g => g.Sum(w => w.EstimatedCost))
                .Take(10)
                .Select(g => new WasteByProductDto(
                    g.Key.ProductId, g.Key.Name, g.Count(),
                    g.Sum(w => w.Quantity), g.Sum(w => w.EstimatedCost))).ToList();

            return Result<WasteSummaryDto>.Success(new WasteSummaryDto(
                wastes.Sum(w => w.EstimatedCost), wastes.Count, byType, byProduct));
        }
        catch (Exception ex) { return Result<WasteSummaryDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteAsync(long id)
    {
        try
        {
            var waste = await _uow.Repository<ProductionWaste>().GetByIdAsync(id);
            if (waste == null) return Result<bool>.Failure("سجل الهدر غير موجود");
            waste.IsDeleted = true;
            _uow.Repository<ProductionWaste>().Update(waste);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف سجل الهدر");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    private async Task<ProductionWasteDto?> GetWasteDto(long id)
    {
        var w = await _uow.Repository<ProductionWaste>().Query()
            .Include(w => w.Product)
            .Include(w => w.ProductionOrder)
            .Include(w => w.Unit)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (w == null) return null;
        var reporterName = (await _uow.Repository<User>().GetByIdAsync(w.ReportedByUserId))?.FullName;
        return new ProductionWasteDto(
            w.Id, w.ProductionOrderId, w.ProductionOrder?.Code,
            w.WasteType.ToString(), w.ProductId, w.Product?.Name ?? "",
            w.Quantity, w.UnitId, w.Unit?.Name,
            w.EstimatedCost, w.Reason,
            w.ReportedByUserId, reporterName,
            w.ReportedAt, w.BranchId);
    }
}

