using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// KitchenStationService
// ════════════════════════════════════════════════════════════════

public class KitchenStationService : IKitchenStationService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public KitchenStationService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<List<KitchenStationDto>>> GetAllAsync(int? branchId)
    {
        try
        {
            var query = _uow.Repository<KitchenStation>().Query()
                .Include(s => s.ProductStations)
                .AsQueryable();

            if (branchId.HasValue)
                query = query.Where(s => s.BranchId == branchId);

            var stations = await query.OrderBy(s => s.DisplayOrder).ToListAsync();

            var dtos = stations.Select(s => new KitchenStationDto(
                s.Id, s.Code, s.Name, s.StationType.ToString(),
                s.DisplayOrder, s.Color, s.IsActive,
                s.MaxConcurrentOrders, s.AveragePreparationMinutes,
                s.BranchId, s.ProductStations.Count, 0)).ToList();

            return Result<List<KitchenStationDto>>.Success(dtos);
        }
        catch (Exception ex) { return Result<List<KitchenStationDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<KitchenStationDto>> GetByIdAsync(int id)
    {
        try
        {
            var s = await _uow.Repository<KitchenStation>().Query()
                .Include(s => s.ProductStations)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (s == null) return Result<KitchenStationDto>.Failure("المحطة غير موجودة");
            return Result<KitchenStationDto>.Success(new KitchenStationDto(
                s.Id, s.Code, s.Name, s.StationType.ToString(),
                s.DisplayOrder, s.Color, s.IsActive,
                s.MaxConcurrentOrders, s.AveragePreparationMinutes,
                s.BranchId, s.ProductStations.Count, 0));
        }
        catch (Exception ex) { return Result<KitchenStationDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<KitchenStationDto>> SaveAsync(int? id, SaveKitchenStationRequest request)
    {
        try
        {
            KitchenStation station;
            if (id.HasValue)
            {
                station = await _uow.Repository<KitchenStation>().GetByIdAsync(id.Value)
                    ?? throw new Exception("المحطة غير موجودة");
            }
            else
            {
                station = new KitchenStation();
                await _uow.Repository<KitchenStation>().AddAsync(station);
            }

            station.Code = request.Code;
            station.Name = request.Name;
            station.StationType = Enum.Parse<KitchenStationType>(request.StationType);
            station.DisplayOrder = request.DisplayOrder;
            station.Color = request.Color ?? "#FF5722";
            station.IsActive = request.IsActive;
            station.MaxConcurrentOrders = request.MaxConcurrentOrders;
            station.AveragePreparationMinutes = request.AveragePreparationMinutes;
            station.BranchId = request.BranchId;

            if (id.HasValue) _uow.Repository<KitchenStation>().Update(station);
            await _uow.SaveChangesAsync();
            return await GetByIdAsync(station.Id);
        }
        catch (Exception ex) { return Result<KitchenStationDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var station = await _uow.Repository<KitchenStation>().GetByIdAsync(id);
            if (station == null) return Result<bool>.Failure("المحطة غير موجودة");
            station.IsDeleted = true;
            _uow.Repository<KitchenStation>().Update(station);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف المحطة");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<ProductKitchenStationDto>> AssignProductAsync(AssignProductToStationRequest request)
    {
        try
        {
            var existing = await _uow.Repository<ProductKitchenStation>().Query()
                .FirstOrDefaultAsync(p => p.ProductId == request.ProductId);

            if (existing != null)
            {
                existing.KitchenStationId = request.KitchenStationId;
                existing.Priority = request.Priority;
                existing.EstimatedPrepMinutes = request.EstimatedPrepMinutes;
                _uow.Repository<ProductKitchenStation>().Update(existing);
            }
            else
            {
                existing = new ProductKitchenStation
                {
                    ProductId = request.ProductId,
                    KitchenStationId = request.KitchenStationId,
                    Priority = request.Priority,
                    EstimatedPrepMinutes = request.EstimatedPrepMinutes
                };
                await _uow.Repository<ProductKitchenStation>().AddAsync(existing);
            }
            await _uow.SaveChangesAsync();

            var dto = await _uow.Repository<ProductKitchenStation>().Query()
                .Include(p => p.Product).Include(p => p.KitchenStation)
                .FirstOrDefaultAsync(p => p.Id == existing.Id);

            return Result<ProductKitchenStationDto>.Success(new ProductKitchenStationDto(
                dto!.Id, dto.ProductId, dto.Product?.Name ?? "",
                dto.KitchenStationId, dto.KitchenStation?.Name ?? "",
                dto.Priority, dto.EstimatedPrepMinutes));
        }
        catch (Exception ex) { return Result<ProductKitchenStationDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> RemoveProductAsync(int productId)
    {
        try
        {
            var mapping = await _uow.Repository<ProductKitchenStation>().Query()
                .FirstOrDefaultAsync(p => p.ProductId == productId);
            if (mapping == null) return Result<bool>.Failure("المنتج غير مرتبط بمحطة");
            _uow.Repository<ProductKitchenStation>().Remove(mapping);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true);
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<List<ProductKitchenStationDto>>> GetProductAssignmentsAsync(int? stationId)
    {
        try
        {
            var query = _uow.Repository<ProductKitchenStation>().Query()
                .Include(p => p.Product).Include(p => p.KitchenStation)
                .AsQueryable();

            if (stationId.HasValue)
                query = query.Where(p => p.KitchenStationId == stationId);

            var items = await query.OrderBy(p => p.Priority).ToListAsync();
            var dtos = items.Select(p => new ProductKitchenStationDto(
                p.Id, p.ProductId, p.Product?.Name ?? "",
                p.KitchenStationId, p.KitchenStation?.Name ?? "",
                p.Priority, p.EstimatedPrepMinutes)).ToList();

            return Result<List<ProductKitchenStationDto>>.Success(dtos);
        }
        catch (Exception ex) { return Result<List<ProductKitchenStationDto>>.Failure($"خطأ: {ex.Message}"); }
    }
}

// ════════════════════════════════════════════════════════════════
// ProductionOrderService
// ════════════════════════════════════════════════════════════════

