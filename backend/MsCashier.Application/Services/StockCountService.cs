using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

public class StockCountService : IStockCountService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly IInventoryService _inventory;

    public StockCountService(IUnitOfWork uow, ICurrentTenantService tenant, IInventoryService inventory)
    {
        _uow = uow;
        _tenant = tenant;
        _inventory = inventory;
    }

    public async Task<Result<StockCountDto>> StartAsync(StartStockCountRequest request)
    {
        try
        {
            // Check no active count for same warehouse
            var active = await _uow.Repository<StockCount>().AnyAsync(sc =>
                sc.TenantId == _tenant.TenantId &&
                sc.WarehouseId == request.WarehouseId &&
                sc.Status == StockCountStatus.InProgress &&
                !sc.IsDeleted);

            if (active)
                return Result<StockCountDto>.Failure("توجد جلسة جرد نشطة لهذا المخزن. أكملها أو ألغها أولاً.");

            var warehouse = await _uow.Repository<Warehouse>().Query()
                .FirstOrDefaultAsync(w => w.Id == request.WarehouseId && w.TenantId == _tenant.TenantId && !w.IsDeleted);
            if (warehouse is null)
                return Result<StockCountDto>.Failure("المخزن غير موجود");

            // Load all products with their current stock in this warehouse
            var inventoryItems = await _uow.Repository<Inventory>().Query()
                .Where(i => i.TenantId == _tenant.TenantId && i.WarehouseId == request.WarehouseId && i.Quantity > 0)
                .Include(i => i.Product)
                .Where(i => !i.Product!.IsDeleted)
                .ToListAsync();

            var stockCount = new StockCount
            {
                TenantId = _tenant.TenantId,
                WarehouseId = request.WarehouseId,
                Notes = request.Notes,
                Status = StockCountStatus.InProgress,
                CreatedBy = _tenant.UserId,
                Items = inventoryItems.Select(inv => new StockCountItem
                {
                    ProductId = inv.ProductId,
                    SystemQty = inv.Quantity,
                    CountedQty = 0,
                    Status = StockCountItemStatus.Pending,
                    IsSettled = false
                }).ToList()
            };

            await _uow.Repository<StockCount>().AddAsync(stockCount);
            await _uow.SaveChangesAsync();

            return Result<StockCountDto>.Success(
                ToDto(stockCount, warehouse.Name),
                "تم بدء جلسة الجرد");
        }
        catch (Exception ex)
        {
            return Result<StockCountDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<StockCountDto>> GetAsync(int id)
    {
        try
        {
            var sc = await LoadStockCount(id);
            if (sc is null)
                return Result<StockCountDto>.Failure("جلسة الجرد غير موجودة");

            return Result<StockCountDto>.Success(ToDto(sc, sc.Warehouse.Name));
        }
        catch (Exception ex)
        {
            return Result<StockCountDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<List<StockCountDto>>> GetAllAsync()
    {
        try
        {
            var list = await _uow.Repository<StockCount>().Query()
                .Where(sc => sc.TenantId == _tenant.TenantId && !sc.IsDeleted)
                .Include(sc => sc.Warehouse)
                .Include(sc => sc.Items)
                .OrderByDescending(sc => sc.CreatedAt)
                .ToListAsync();

            return Result<List<StockCountDto>>.Success(
                list.Select(sc => ToDto(sc, sc.Warehouse.Name)).ToList());
        }
        catch (Exception ex)
        {
            return Result<List<StockCountDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<List<StockCountItemDto>>> GetItemsAsync(int stockCountId)
    {
        try
        {
            var items = await _uow.Repository<StockCountItem>().Query()
                .Where(i => i.StockCountId == stockCountId)
                .Include(i => i.Product)
                .OrderBy(i => i.Product!.Name)
                .ToListAsync();

            return Result<List<StockCountItemDto>>.Success(
                items.Select(ToItemDto).ToList());
        }
        catch (Exception ex)
        {
            return Result<List<StockCountItemDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<StockCountItemDto>> ScanProductAsync(int stockCountId, ScanProductRequest request)
    {
        try
        {
            var sc = await _uow.Repository<StockCount>().Query()
                .FirstOrDefaultAsync(s => s.Id == stockCountId && s.TenantId == _tenant.TenantId && !s.IsDeleted);

            if (sc is null)
                return Result<StockCountItemDto>.Failure("جلسة الجرد غير موجودة");
            if (sc.Status != StockCountStatus.InProgress)
                return Result<StockCountItemDto>.Failure("جلسة الجرد مكتملة أو ملغاة");

            var item = await _uow.Repository<StockCountItem>().Query()
                .Include(i => i.Product)
                .FirstOrDefaultAsync(i => i.StockCountId == stockCountId && i.ProductId == request.ProductId);

            if (item is null)
            {
                // Product not in original list (zero stock) — add it
                var product = await _uow.Repository<Product>().Query()
                    .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.TenantId == _tenant.TenantId && !p.IsDeleted);
                if (product is null)
                    return Result<StockCountItemDto>.Failure("الصنف غير موجود");

                item = new StockCountItem
                {
                    StockCountId = stockCountId,
                    ProductId = request.ProductId,
                    SystemQty = 0,
                    CountedQty = request.Quantity,
                    Status = StockCountItemStatus.Pending,
                    Product = product
                };
                await _uow.Repository<StockCountItem>().AddAsync(item);
            }
            else
            {
                item.CountedQty += request.Quantity;
            }

            // Auto-calculate status
            var variance = item.CountedQty - item.SystemQty;
            item.Status = variance == 0 ? StockCountItemStatus.Matched
                        : variance < 0 ? StockCountItemStatus.Shortage
                        : StockCountItemStatus.Surplus;

            await _uow.SaveChangesAsync();

            return Result<StockCountItemDto>.Success(ToItemDto(item),
                $"تم تسجيل {item.CountedQty} لـ {item.Product.Name}");
        }
        catch (Exception ex)
        {
            return Result<StockCountItemDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<StockCountItemDto>> SetCountedQtyAsync(int stockCountId, long itemId, SetCountedQtyRequest request)
    {
        try
        {
            var sc = await _uow.Repository<StockCount>().Query()
                .FirstOrDefaultAsync(s => s.Id == stockCountId && s.TenantId == _tenant.TenantId && !s.IsDeleted);

            if (sc is null)
                return Result<StockCountItemDto>.Failure("جلسة الجرد غير موجودة");
            if (sc.Status != StockCountStatus.InProgress)
                return Result<StockCountItemDto>.Failure("جلسة الجرد مكتملة أو ملغاة");

            var item = await _uow.Repository<StockCountItem>().Query()
                .Include(i => i.Product)
                .FirstOrDefaultAsync(i => i.Id == itemId && i.StockCountId == stockCountId);

            if (item is null)
                return Result<StockCountItemDto>.Failure("سطر الجرد غير موجود");

            if (request.CountedQty < 0)
                return Result<StockCountItemDto>.Failure("الكمية لا يمكن أن تكون سالبة");

            item.CountedQty = request.CountedQty;

            var variance = item.CountedQty - item.SystemQty;
            item.Status = variance == 0 ? StockCountItemStatus.Matched
                        : variance < 0 ? StockCountItemStatus.Shortage
                        : StockCountItemStatus.Surplus;

            await _uow.SaveChangesAsync();

            return Result<StockCountItemDto>.Success(ToItemDto(item),
                $"تم تحديث الكمية إلى {item.CountedQty} لـ {item.Product.Name}");
        }
        catch (Exception ex)
        {
            return Result<StockCountItemDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<StockCountItemDto>> SettleItemAsync(int stockCountId, long itemId, SettleItemRequest request)
    {
        try
        {
            var sc = await _uow.Repository<StockCount>().Query()
                .FirstOrDefaultAsync(s => s.Id == stockCountId && s.TenantId == _tenant.TenantId && !s.IsDeleted);

            if (sc is null)
                return Result<StockCountItemDto>.Failure("جلسة الجرد غير موجودة");
            if (sc.Status != StockCountStatus.InProgress)
                return Result<StockCountItemDto>.Failure("جلسة الجرد مكتملة أو ملغاة");

            var item = await _uow.Repository<StockCountItem>().Query()
                .Include(i => i.Product)
                .FirstOrDefaultAsync(i => i.Id == itemId && i.StockCountId == stockCountId);

            if (item is null)
                return Result<StockCountItemDto>.Failure("سطر الجرد غير موجود");

            // Adjust actual inventory to match counted qty
            await _inventory.AdjustStockAsync(item.ProductId, sc.WarehouseId, item.CountedQty,
                $"تسوية جرد #{stockCountId}: {item.SystemQty} → {item.CountedQty}" +
                (request.Notes != null ? $" | {request.Notes}" : ""));

            item.IsSettled = true;
            item.Notes = request.Notes;
            item.SystemQty = item.CountedQty; // Update to reflect new reality
            item.Status = StockCountItemStatus.Matched;

            await _uow.SaveChangesAsync();

            return Result<StockCountItemDto>.Success(ToItemDto(item), "تمت تسوية الصنف");
        }
        catch (Exception ex)
        {
            return Result<StockCountItemDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<StockCountDto>> CompleteAsync(int id)
    {
        try
        {
            var sc = await LoadStockCount(id);
            if (sc is null)
                return Result<StockCountDto>.Failure("جلسة الجرد غير موجودة");
            if (sc.Status != StockCountStatus.InProgress)
                return Result<StockCountDto>.Failure("جلسة الجرد ليست نشطة");

            sc.Status = StockCountStatus.Completed;
            sc.CompletedAt = DateTime.UtcNow;
            sc.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<StockCount>().Update(sc);
            await _uow.SaveChangesAsync();

            return Result<StockCountDto>.Success(ToDto(sc, sc.Warehouse.Name), "تم إكمال جلسة الجرد");
        }
        catch (Exception ex)
        {
            return Result<StockCountDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> CancelAsync(int id)
    {
        try
        {
            var sc = await _uow.Repository<StockCount>().Query()
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == _tenant.TenantId && !s.IsDeleted);

            if (sc is null)
                return Result<bool>.Failure("جلسة الجرد غير موجودة");
            if (sc.Status != StockCountStatus.InProgress)
                return Result<bool>.Failure("جلسة الجرد ليست نشطة");

            sc.Status = StockCountStatus.Cancelled;
            sc.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<StockCount>().Update(sc);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم إلغاء جلسة الجرد");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<int>> BulkSetOpeningBalancesAsync(BulkOpeningBalanceRequest request)
    {
        try
        {
            var count = 0;
            foreach (var row in request.Items)
            {
                if (row.Quantity < 0) continue;

                var result = await _inventory.AdjustStockAsync(
                    row.ProductId, row.WarehouseId, row.Quantity,
                    request.Notes ?? "رصيد افتتاحي");

                if (result.IsSuccess) count++;
            }

            await _uow.SaveChangesAsync();
            return Result<int>.Success(count, $"تم تحديث الأرصدة الافتتاحية لـ {count} صنف");
        }
        catch (Exception ex)
        {
            return Result<int>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ---- Helpers ----

    private async Task<StockCount?> LoadStockCount(int id) =>
        await _uow.Repository<StockCount>().Query()
            .Include(sc => sc.Warehouse)
            .Include(sc => sc.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(sc => sc.Id == id && sc.TenantId == _tenant.TenantId && !sc.IsDeleted);

    private static StockCountDto ToDto(StockCount sc, string warehouseName) => new(
        sc.Id, sc.WarehouseId, warehouseName, sc.Status.ToString(),
        sc.Notes, sc.CreatedAt, sc.CompletedAt,
        sc.Items.Count,
        sc.Items.Count(i => i.CountedQty > 0),
        sc.Items.Count(i => i.IsSettled));

    private static StockCountItemDto ToItemDto(StockCountItem i) => new(
        i.Id, i.ProductId, i.Product?.Name ?? "", i.Product?.Barcode,
        i.SystemQty, i.CountedQty, i.CountedQty - i.SystemQty,
        i.Status.ToString(), i.IsSettled, i.Notes);
}
