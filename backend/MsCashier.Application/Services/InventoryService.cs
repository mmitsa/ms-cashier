using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 12. InventoryService
// ════════════════════════════════════════════════════════════════

public class InventoryService : IInventoryService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public InventoryService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<List<ProductDto>>> GetInventoryAsync(int warehouseId, string? search)
    {
        try
        {
            var inventoryList = await _uow.Repository<Inventory>().Query()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.WarehouseId == warehouseId)
                .ToListAsync();

            var productIds = inventoryList.Select(i => i.ProductId).Distinct().ToList();

            var productsQuery = _uow.Repository<Product>().Query()
                .Where(p =>
                    productIds.Contains(p.Id) &&
                    !p.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                productsQuery = productsQuery.Where(p =>
                    p.Name.ToLower().Contains(term) ||
                    (p.Barcode != null && p.Barcode.Contains(term)));
            }

            var products = await productsQuery.ToListAsync();

            var categoryIds = products.Where(p => p.CategoryId.HasValue).Select(p => p.CategoryId!.Value).Distinct().ToList();
            var unitIds = products.Where(p => p.UnitId.HasValue).Select(p => p.UnitId!.Value).Distinct().ToList();

            var categories = categoryIds.Count > 0
                ? await _uow.Repository<Category>().Query()
                    .Where(c => categoryIds.Contains(c.Id))
                    .ToDictionaryAsync(c => c.Id, c => c.Name)
                : new Dictionary<int, string>();

            var units = unitIds.Count > 0
                ? await _uow.Repository<Unit>().Query()
                    .Where(u => unitIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.Name)
                : new Dictionary<int, string>();

            var inventoryDict = inventoryList.ToDictionary(i => i.ProductId, i => i.Quantity);

            var dtos = products.Select(p => new ProductDto(
                p.Id, p.Barcode, p.SKU, p.Name, p.Description,
                p.CategoryId,
                p.CategoryId.HasValue && categories.ContainsKey(p.CategoryId.Value) ? categories[p.CategoryId.Value] : null,
                p.UnitId,
                p.UnitId.HasValue && units.ContainsKey(p.UnitId.Value) ? units[p.UnitId.Value] : null,
                p.CostPrice, p.RetailPrice, p.HalfWholesalePrice, p.WholesalePrice, p.Price4,
                (int)p.MinStock,
                inventoryDict.ContainsKey(p.Id) ? inventoryDict[p.Id] : 0,
                p.IsActive, p.TaxRate, p.ImageUrl
            )).ToList();

            return Result<List<ProductDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<ProductDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> AdjustStockAsync(int productId, int warehouseId, decimal newQuantity, string? notes)
    {
        try
        {
            var product = await _uow.Repository<Product>().Query()
                .FirstOrDefaultAsync(p =>
                    p.Id == productId &&
                    p.TenantId == _tenant.TenantId &&
                    !p.IsDeleted);

            if (product is null)
                return Result<bool>.Failure("المنتج غير موجود");

            var inventory = await _uow.Repository<Inventory>().Query()
                .FirstOrDefaultAsync(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.ProductId == productId &&
                    i.WarehouseId == warehouseId);

            decimal previousQty = 0;

            if (inventory is not null)
            {
                previousQty = inventory.Quantity;
                inventory.Quantity = newQuantity;
                inventory.LastUpdated = DateTime.UtcNow;
                _uow.Repository<Inventory>().Update(inventory);
            }
            else
            {
                inventory = new Inventory
                {
                    TenantId = _tenant.TenantId,
                    ProductId = productId,
                    WarehouseId = warehouseId,
                    Quantity = newQuantity,
                    ReservedQty = 0,
                    LastUpdated = DateTime.UtcNow
                };
                await _uow.Repository<Inventory>().AddAsync(inventory);
            }

            var difference = newQuantity - previousQty;
            var transaction = new InventoryTransaction
            {
                TenantId = _tenant.TenantId,
                ProductId = productId,
                WarehouseId = warehouseId,
                TransactionType = InventoryTransactionType.Adjustment,
                Quantity = Math.Abs(difference),
                PreviousQty = previousQty,
                NewQty = newQuantity,
                ReferenceType = "Adjustment",
                Notes = notes ?? $"تعديل يدوي: {previousQty} → {newQuantity}",
                CreatedBy = _tenant.UserId,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.Repository<InventoryTransaction>().AddAsync(transaction);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم تعديل المخزون بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<FinanceTransactionDto>>> GetMovementsAsync(
        int productId, DateTime from, DateTime to, int page, int pageSize)
    {
        try
        {
            var fromDate = from.Date;
            var toDate = to.Date.AddDays(1);

            var query = _uow.Repository<InventoryTransaction>().Query()
                .Where(t =>
                    t.TenantId == _tenant.TenantId &&
                    t.ProductId == productId &&
                    t.CreatedAt >= fromDate &&
                    t.CreatedAt < toDate);

            var totalCount = await query.CountAsync();

            var transactions = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var creatorIds = transactions.Select(t => t.CreatedBy).Distinct().ToList();
            var creators = await _uow.Repository<User>().Query()
                .Where(u => creatorIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.FullName);

            var dtos = transactions.Select(t => new FinanceTransactionDto(
                t.Id,
                t.WarehouseId,
                t.TransactionType.ToString(),
                TransactionType.Income,
                t.ReferenceType,
                t.Quantity,
                t.NewQty,
                t.Notes,
                t.CreatedAt,
                creators.ContainsKey(t.CreatedBy) ? creators[t.CreatedBy] : ""
            )).ToList();

            var result = new PagedResult<FinanceTransactionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };

            return Result<PagedResult<FinanceTransactionDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<FinanceTransactionDto>>.Failure($"خطأ: {ex.Message}");
        }
    }
}

// ════════════════════════════════════════════════════════════════
// TenantService
// ════════════════════════════════════════════════════════════════

