using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 6. WarehouseService
// ════════════════════════════════════════════════════════════════

public class WarehouseService : IWarehouseService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public WarehouseService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<WarehouseDto>> CreateAsync(string name, string? location, bool isMain)
    {
        try
        {
            var exists = await _uow.Repository<Warehouse>().AnyAsync(w =>
                w.TenantId == _tenant.TenantId &&
                w.Name == name &&
                !w.IsDeleted);

            if (exists)
                return Result<WarehouseDto>.Failure("المستودع موجود بالفعل");

            if (isMain)
            {
                var currentMain = await _uow.Repository<Warehouse>().Query()
                    .Where(w =>
                        w.TenantId == _tenant.TenantId &&
                        w.IsMain &&
                        !w.IsDeleted)
                    .ToListAsync();

                foreach (var w in currentMain)
                {
                    w.IsMain = false;
                    _uow.Repository<Warehouse>().Update(w);
                }
            }

            var warehouse = new Warehouse
            {
                TenantId = _tenant.TenantId,
                Name = name,
                Location = location,
                IsMain = isMain,
                IsActive = true
            };

            await _uow.Repository<Warehouse>().AddAsync(warehouse);
            await _uow.SaveChangesAsync();

            return Result<WarehouseDto>.Success(
                new WarehouseDto(warehouse.Id, warehouse.Name, warehouse.Location, warehouse.IsMain, 0, 0),
                "تم إنشاء المستودع بنجاح");
        }
        catch (Exception ex)
        {
            return Result<WarehouseDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<List<WarehouseDto>>> GetAllAsync()
    {
        try
        {
            var warehouses = await _uow.Repository<Warehouse>().Query()
                .Where(w => w.TenantId == _tenant.TenantId && !w.IsDeleted)
                .OrderBy(w => w.Name)
                .ToListAsync();

            var warehouseIds = warehouses.Select(w => w.Id).ToList();

            var inventoryData = await _uow.Repository<Inventory>().Query()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    warehouseIds.Contains(i.WarehouseId))
                .ToListAsync();

            var productIds = inventoryData.Select(i => i.ProductId).Distinct().ToList();
            var productCosts = productIds.Count > 0
                ? await _uow.Repository<Product>().Query()
                    .Where(p => productIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, p => p.CostPrice)
                : new Dictionary<int, decimal>();

            var dtos = warehouses.Select(w =>
            {
                var warehouseInventory = inventoryData.Where(i => i.WarehouseId == w.Id).ToList();
                var totalItems = warehouseInventory.Count;
                var totalValue = warehouseInventory.Sum(i =>
                    productCosts.ContainsKey(i.ProductId)
                        ? i.Quantity * productCosts[i.ProductId]
                        : 0);

                return new WarehouseDto(w.Id, w.Name, w.Location, w.IsMain, totalItems, totalValue);
            }).ToList();

            return Result<List<WarehouseDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<WarehouseDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> TransferStockAsync(StockTransferRequest request)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var fromWarehouse = await _uow.Repository<Warehouse>().Query()
                .FirstOrDefaultAsync(w =>
                    w.Id == request.FromWarehouseId &&
                    w.TenantId == _tenant.TenantId &&
                    !w.IsDeleted);

            var toWarehouse = await _uow.Repository<Warehouse>().Query()
                .FirstOrDefaultAsync(w =>
                    w.Id == request.ToWarehouseId &&
                    w.TenantId == _tenant.TenantId &&
                    !w.IsDeleted);

            if (fromWarehouse is null || toWarehouse is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<bool>.Failure("المستودع غير موجود");
            }

            var transferCount = await _uow.Repository<StockTransfer>().CountAsync(t =>
                t.TenantId == _tenant.TenantId);
            var transferNumber = $"TRF-{(transferCount + 1):D6}";

            var transfer = new StockTransfer
            {
                TenantId = _tenant.TenantId,
                TransferNumber = transferNumber,
                FromWarehouseId = request.FromWarehouseId,
                ToWarehouseId = request.ToWarehouseId,
                Status = (byte)StockTransferStatus.Completed,
                Notes = request.Notes,
                CreatedBy = _tenant.UserId,
                CompletedAt = DateTime.UtcNow
            };
            await _uow.Repository<StockTransfer>().AddAsync(transfer);
            await _uow.SaveChangesAsync();

            foreach (var item in request.Items)
            {
                var sourceInventory = await _uow.Repository<Inventory>().Query()
                    .FirstOrDefaultAsync(i =>
                        i.TenantId == _tenant.TenantId &&
                        i.ProductId == item.ProductId &&
                        i.WarehouseId == request.FromWarehouseId);

                if (sourceInventory is null || sourceInventory.Quantity < item.Quantity)
                {
                    await _uow.RollbackTransactionAsync();
                    return Result<bool>.Failure($"كمية غير كافية في المستودع المصدر للمنتج رقم {item.ProductId}");
                }

                var prevQtySource = sourceInventory.Quantity;
                sourceInventory.Quantity -= item.Quantity;
                sourceInventory.LastUpdated = DateTime.UtcNow;
                _uow.Repository<Inventory>().Update(sourceInventory);

                var destInventory = await _uow.Repository<Inventory>().Query()
                    .FirstOrDefaultAsync(i =>
                        i.TenantId == _tenant.TenantId &&
                        i.ProductId == item.ProductId &&
                        i.WarehouseId == request.ToWarehouseId);

                decimal prevQtyDest = 0;
                if (destInventory is not null)
                {
                    prevQtyDest = destInventory.Quantity;
                    destInventory.Quantity += item.Quantity;
                    destInventory.LastUpdated = DateTime.UtcNow;
                    _uow.Repository<Inventory>().Update(destInventory);
                }
                else
                {
                    destInventory = new Inventory
                    {
                        TenantId = _tenant.TenantId,
                        ProductId = item.ProductId,
                        WarehouseId = request.ToWarehouseId,
                        Quantity = item.Quantity,
                        ReservedQty = 0,
                        LastUpdated = DateTime.UtcNow
                    };
                    await _uow.Repository<Inventory>().AddAsync(destInventory);
                }

                var transferItem = new StockTransferItem
                {
                    TransferId = transfer.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    ReceivedQty = item.Quantity
                };
                await _uow.Repository<StockTransferItem>().AddAsync(transferItem);

                var txOut = new InventoryTransaction
                {
                    TenantId = _tenant.TenantId,
                    ProductId = item.ProductId,
                    WarehouseId = request.FromWarehouseId,
                    TransactionType = InventoryTransactionType.Transfer,
                    Quantity = item.Quantity,
                    PreviousQty = prevQtySource,
                    NewQty = sourceInventory.Quantity,
                    ReferenceType = "StockTransfer",
                    ReferenceId = transfer.Id.ToString(),
                    Notes = $"تحويل إلى {toWarehouse.Name} - {transferNumber}",
                    CreatedBy = _tenant.UserId,
                    CreatedAt = DateTime.UtcNow
                };
                await _uow.Repository<InventoryTransaction>().AddAsync(txOut);

                var txIn = new InventoryTransaction
                {
                    TenantId = _tenant.TenantId,
                    ProductId = item.ProductId,
                    WarehouseId = request.ToWarehouseId,
                    TransactionType = InventoryTransactionType.Transfer,
                    Quantity = item.Quantity,
                    PreviousQty = prevQtyDest,
                    NewQty = prevQtyDest + item.Quantity,
                    ReferenceType = "StockTransfer",
                    ReferenceId = transfer.Id.ToString(),
                    Notes = $"تحويل من {fromWarehouse.Name} - {transferNumber}",
                    CreatedBy = _tenant.UserId,
                    CreatedAt = DateTime.UtcNow
                };
                await _uow.Repository<InventoryTransaction>().AddAsync(txIn);
            }

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            return Result<bool>.Success(true, "تم تحويل المخزون بنجاح");
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }
}

// ════════════════════════════════════════════════════════════════
// 7. FinanceService
// ════════════════════════════════════════════════════════════════

