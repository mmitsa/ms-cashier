using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ============================================================
// Floor Section Service
// ============================================================

public class FloorSectionService : IFloorSectionService
{
    private readonly IUnitOfWork _uow;
    public FloorSectionService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<FloorOverviewDto>> GetFloorOverviewAsync(int? branchId)
    {
        var sectionsResult = await GetSectionsAsync(branchId);
        if (!sectionsResult.IsSuccess) return Result<FloorOverviewDto>.Failure(sectionsResult.Errors.FirstOrDefault() ?? "خطأ");

        var sections = sectionsResult.Data!;

        // Also include unassigned tables
        var tablesQuery = _uow.Repository<RestaurantTable>().Query().Where(t => t.IsActive);
        if (branchId.HasValue) tablesQuery = tablesQuery.Where(t => t.BranchId == branchId);

        var allTables = await tablesQuery.ToListAsync();
        var orders = await _uow.Repository<DineOrder>().Query()
            .Where(o => o.Status != DineOrderStatus.Billed && o.Status != DineOrderStatus.Cancelled)
            .Select(o => new { o.TableId, o.GuestCount })
            .ToListAsync();

        var totalGuests = orders.Where(o => o.GuestCount.HasValue).Sum(o => o.GuestCount!.Value);

        var overview = new FloorOverviewDto(
            sections,
            allTables.Count,
            allTables.Count(t => t.Status == TableStatus.Occupied),
            allTables.Count(t => t.Status == TableStatus.Available),
            allTables.Sum(t => t.Capacity),
            totalGuests);

        return Result<FloorOverviewDto>.Success(overview);
    }

    public async Task<Result<List<FloorSectionDto>>> GetSectionsAsync(int? branchId)
    {
        var query = _uow.Repository<FloorSection>().Query();
        if (branchId.HasValue) query = query.Where(s => s.BranchId == branchId);

        var sections = await query.OrderBy(s => s.SortOrder).ThenBy(s => s.Name)
            .Include(s => s.Tables)
            .ToListAsync();

        var activeOrders = await _uow.Repository<DineOrder>().Query()
            .Where(o => o.Status != DineOrderStatus.Billed && o.Status != DineOrderStatus.Cancelled)
            .Select(o => o.TableId)
            .ToListAsync();

        var occupiedTableIds = new HashSet<int?>(activeOrders);

        var dtos = sections.Select(s =>
        {
            var activeTables = s.Tables.Where(t => t.IsActive).ToList();
            var occupied = activeTables.Count(t => occupiedTableIds.Contains(t.Id) || t.Status == TableStatus.Occupied);
            return new FloorSectionDto(
                s.Id, s.Name, s.Description, s.Color, s.Icon,
                s.SortOrder, s.IsActive, s.IsOutdoor, s.HasAC,
                s.IsSmokingAllowed, s.IsVIP, s.BranchId,
                s.ServiceChargePercent, s.MaxCapacity,
                s.OperatingHours,
                activeTables.Count, occupied,
                activeTables.Count - occupied,
                activeTables.Sum(t => t.Capacity));
        }).ToList();

        return Result<List<FloorSectionDto>>.Success(dtos);
    }

    public async Task<Result<FloorSectionDto>> GetByIdAsync(int id)
    {
        var s = await _uow.Repository<FloorSection>().Query()
            .Include(x => x.Tables)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (s is null) return Result<FloorSectionDto>.Failure("المنطقة غير موجودة");

        var activeTables = s.Tables.Where(t => t.IsActive).ToList();
        var occupied = activeTables.Count(t => t.Status == TableStatus.Occupied);

        var dto = new FloorSectionDto(
            s.Id, s.Name, s.Description, s.Color, s.Icon,
            s.SortOrder, s.IsActive, s.IsOutdoor, s.HasAC,
            s.IsSmokingAllowed, s.IsVIP, s.BranchId,
            s.ServiceChargePercent, s.MaxCapacity,
            s.OperatingHours,
            activeTables.Count, occupied,
            activeTables.Count - occupied,
            activeTables.Sum(t => t.Capacity));

        return Result<FloorSectionDto>.Success(dto);
    }

    public async Task<Result<FloorSectionDto>> SaveAsync(int? id, SaveFloorSectionRequest req)
    {
        FloorSection entity;
        if (id.HasValue)
        {
            entity = await _uow.Repository<FloorSection>().Query()
                .FirstOrDefaultAsync(x => x.Id == id.Value)
                ?? throw new KeyNotFoundException();
        }
        else
        {
            entity = new FloorSection();
            await _uow.Repository<FloorSection>().AddAsync(entity);
        }

        entity.Name = req.Name;
        entity.Description = req.Description;
        entity.Color = req.Color ?? "#6366f1";
        entity.Icon = req.Icon ?? "sofa";
        entity.SortOrder = req.SortOrder;
        entity.IsActive = req.IsActive;
        entity.IsOutdoor = req.IsOutdoor;
        entity.HasAC = req.HasAC;
        entity.IsSmokingAllowed = req.IsSmokingAllowed;
        entity.IsVIP = req.IsVIP;
        entity.BranchId = req.BranchId;
        entity.ServiceChargePercent = req.ServiceChargePercent;
        entity.MaxCapacity = req.MaxCapacity;
        entity.OperatingHours = req.OperatingHours;

        await _uow.SaveChangesAsync();
        return await GetByIdAsync(entity.Id);
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var entity = await _uow.Repository<FloorSection>().Query()
            .Include(s => s.Tables)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (entity is null) return Result<bool>.Failure("المنطقة غير موجودة");

        // Detach tables from this section
        foreach (var table in entity.Tables)
        {
            table.SectionId = null;
            table.Section = null;
        }

        _uow.Repository<FloorSection>().Remove(entity);
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> ReorderAsync(List<int> sectionIds)
    {
        var sections = await _uow.Repository<FloorSection>().Query()
            .Where(s => sectionIds.Contains(s.Id))
            .ToListAsync();

        for (int i = 0; i < sectionIds.Count; i++)
        {
            var section = sections.FirstOrDefault(s => s.Id == sectionIds[i]);
            if (section != null) section.SortOrder = i;
        }

        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> AssignTableToSectionAsync(int tableId, int sectionId)
    {
        var table = await _uow.Repository<RestaurantTable>().Query()
            .FirstOrDefaultAsync(t => t.Id == tableId);
        if (table is null) return Result<bool>.Failure("الطاولة غير موجودة");

        var section = await _uow.Repository<FloorSection>().Query()
            .FirstOrDefaultAsync(s => s.Id == sectionId);
        if (section is null) return Result<bool>.Failure("المنطقة غير موجودة");

        table.SectionId = sectionId;
        table.Section = section.Name;

        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> RemoveTableFromSectionAsync(int tableId)
    {
        var table = await _uow.Repository<RestaurantTable>().Query()
            .FirstOrDefaultAsync(t => t.Id == tableId);
        if (table is null) return Result<bool>.Failure("الطاولة غير موجودة");

        table.SectionId = null;
        table.Section = null;

        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}

// ============================================================
// QR Config Service (store owner management)
// ============================================================

