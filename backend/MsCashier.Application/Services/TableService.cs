using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ============================================================
// Table Service
// ============================================================

public class TableService : ITableService
{
    private readonly IUnitOfWork _uow;
    public TableService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<List<TableDto>>> GetTablesAsync(int? branchId)
    {
        var query = _uow.Repository<RestaurantTable>().Query();
        if (branchId.HasValue) query = query.Where(t => t.BranchId == branchId);

        var tables = await query.OrderBy(t => t.Section).ThenBy(t => t.TableNumber).ToListAsync();

        // Get active orders per table
        var tableIds = tables.Select(t => t.Id).ToList();
        var activeOrders = await _uow.Repository<DineOrder>().Query()
            .Where(o => o.TableId != null && tableIds.Contains(o.TableId.Value)
                && o.Status != DineOrderStatus.Billed && o.Status != DineOrderStatus.Cancelled)
            .Select(o => new { o.TableId, o.OrderNumber, o.GuestCount })
            .ToListAsync();

        var orderMap = activeOrders.GroupBy(o => o.TableId).ToDictionary(g => g.Key!.Value, g => g.First());

        var dtos = tables.Select(t =>
        {
            orderMap.TryGetValue(t.Id, out var ao);
            return new TableDto(t.Id, t.TableNumber, t.Section, t.Capacity,
                t.Status.ToString(), t.IsActive, t.BranchId,
                t.GridRow, t.GridCol, t.Shape,
                ao?.OrderNumber, ao?.GuestCount);
        }).ToList();

        return Result<List<TableDto>>.Success(dtos);
    }

    public async Task<Result<TableDto>> GetByIdAsync(int id)
    {
        var t = await _uow.Repository<RestaurantTable>().GetByIdAsync(id);
        if (t == null) return Result<TableDto>.Failure("الطاولة غير موجودة");
        return Result<TableDto>.Success(new TableDto(t.Id, t.TableNumber, t.Section, t.Capacity,
            t.Status.ToString(), t.IsActive, t.BranchId, t.GridRow, t.GridCol, t.Shape, null, null));
    }

    public async Task<Result<TableDto>> SaveAsync(int? id, SaveTableRequest dto)
    {
        RestaurantTable t;
        if (id.HasValue)
        {
            t = await _uow.Repository<RestaurantTable>().GetByIdAsync(id.Value)
                ?? throw new InvalidOperationException("الطاولة غير موجودة");
        }
        else
        {
            t = new RestaurantTable();
            await _uow.Repository<RestaurantTable>().AddAsync(t);
        }

        t.TableNumber = dto.TableNumber;
        t.Section = dto.Section;
        t.Capacity = dto.Capacity;
        t.IsActive = dto.IsActive;
        t.BranchId = dto.BranchId;
        t.GridRow = dto.GridRow;
        t.GridCol = dto.GridCol;
        t.Shape = dto.Shape ?? "square";

        await _uow.SaveChangesAsync();

        return Result<TableDto>.Success(new TableDto(t.Id, t.TableNumber, t.Section, t.Capacity,
            t.Status.ToString(), t.IsActive, t.BranchId, t.GridRow, t.GridCol, t.Shape, null, null));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var t = await _uow.Repository<RestaurantTable>().GetByIdAsync(id);
        if (t == null) return Result<bool>.Failure("الطاولة غير موجودة");
        _uow.Repository<RestaurantTable>().Remove(t);
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<TableDto>> UpdateStatusAsync(int id, UpdateTableStatusRequest dto)
    {
        var t = await _uow.Repository<RestaurantTable>().GetByIdAsync(id);
        if (t == null) return Result<TableDto>.Failure("الطاولة غير موجودة");
        if (Enum.TryParse<TableStatus>(dto.Status, out var s)) t.Status = s;
        await _uow.SaveChangesAsync();
        return Result<TableDto>.Success(new TableDto(t.Id, t.TableNumber, t.Section, t.Capacity,
            t.Status.ToString(), t.IsActive, t.BranchId, t.GridRow, t.GridCol, t.Shape, null, null));
    }
}

// ============================================================
// Dine Order Service
// ============================================================

