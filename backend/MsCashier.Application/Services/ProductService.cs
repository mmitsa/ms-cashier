using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 2. ProductService
// ════════════════════════════════════════════════════════════════

public class ProductService : IProductService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public ProductService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<ProductDto>> CreateAsync(CreateProductRequest request)
    {
        try
        {
            var exists = await _uow.Repository<Product>().AnyAsync(p =>
                p.TenantId == _tenant.TenantId &&
                !p.IsDeleted &&
                ((!string.IsNullOrEmpty(request.Barcode) && p.Barcode == request.Barcode) ||
                 p.Name == request.Name));

            if (exists)
                return Result<ProductDto>.Failure("يوجد منتج بنفس الاسم أو الباركود");

            var product = new Product
            {
                TenantId = _tenant.TenantId,
                Barcode = request.Barcode,
                SKU = request.SKU,
                Name = request.Name,
                Description = request.Description,
                CategoryId = request.CategoryId,
                UnitId = request.UnitId,
                CostPrice = request.CostPrice,
                RetailPrice = request.RetailPrice,
                HalfWholesalePrice = request.HalfWholesalePrice,
                WholesalePrice = request.WholesalePrice,
                Price4 = request.Price4,
                MinStock = request.MinStock,
                MaxStock = request.MaxStock,
                TaxRate = request.TaxRate,
                IsActive = true,
                TrackInventory = true
            };

            await _uow.Repository<Product>().AddAsync(product);
            await _uow.SaveChangesAsync();

            if (request.InitialStock > 0 && request.WarehouseId > 0)
            {
                var inventory = new Inventory
                {
                    TenantId = _tenant.TenantId,
                    ProductId = product.Id,
                    WarehouseId = request.WarehouseId,
                    Quantity = request.InitialStock,
                    ReservedQty = 0,
                    LastUpdated = DateTime.UtcNow
                };
                await _uow.Repository<Inventory>().AddAsync(inventory);

                var transaction = new InventoryTransaction
                {
                    TenantId = _tenant.TenantId,
                    ProductId = product.Id,
                    WarehouseId = request.WarehouseId,
                    TransactionType = InventoryTransactionType.StockIn,
                    Quantity = request.InitialStock,
                    PreviousQty = 0,
                    NewQty = request.InitialStock,
                    ReferenceType = "InitialStock",
                    Notes = "رصيد افتتاحي",
                    CreatedBy = _tenant.UserId,
                    CreatedAt = DateTime.UtcNow
                };
                await _uow.Repository<InventoryTransaction>().AddAsync(transaction);
                await _uow.SaveChangesAsync();
            }

            var dto = await BuildProductDto(product.Id);
            return Result<ProductDto>.Success(dto!, "تم إنشاء المنتج بنجاح");
        }
        catch (Exception ex)
        {
            return Result<ProductDto>.Failure($"خطأ أثناء إنشاء المنتج: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<ProductDto>>> SearchAsync(ProductSearchRequest request)
    {
        try
        {
            var query = _uow.Repository<Product>().Query()
                .Where(p => p.TenantId == _tenant.TenantId && !p.IsDeleted);

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var term = request.SearchTerm.Trim().ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(term) ||
                    (p.Barcode != null && p.Barcode.Contains(term)) ||
                    (p.SKU != null && p.SKU.ToLower().Contains(term)));
            }

            if (request.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == request.CategoryId.Value);

            if (request.ActiveOnly == true)
                query = query.Where(p => p.IsActive);

            var productQuery = query
                .GroupJoin(
                    _uow.Repository<Inventory>().Query()
                        .Where(i => i.TenantId == _tenant.TenantId),
                    p => p.Id,
                    i => i.ProductId,
                    (p, inventories) => new { Product = p, Inventories = inventories })
                .SelectMany(
                    x => x.Inventories.DefaultIfEmpty(),
                    (x, inv) => new { x.Product, Inventory = inv })
                .GroupBy(x => new
                {
                    x.Product.Id,
                    x.Product.Barcode,
                    x.Product.SKU,
                    x.Product.Name,
                    x.Product.Description,
                    x.Product.CategoryId,
                    x.Product.UnitId,
                    x.Product.CostPrice,
                    x.Product.RetailPrice,
                    x.Product.HalfWholesalePrice,
                    x.Product.WholesalePrice,
                    x.Product.Price4,
                    x.Product.MinStock,
                    x.Product.IsActive,
                    x.Product.TaxRate,
                    x.Product.ImageUrl
                })
                .Select(g => new
                {
                    g.Key.Id,
                    g.Key.Barcode,
                    g.Key.SKU,
                    g.Key.Name,
                    g.Key.Description,
                    g.Key.CategoryId,
                    g.Key.UnitId,
                    g.Key.CostPrice,
                    g.Key.RetailPrice,
                    g.Key.HalfWholesalePrice,
                    g.Key.WholesalePrice,
                    g.Key.Price4,
                    g.Key.MinStock,
                    g.Key.IsActive,
                    g.Key.TaxRate,
                    g.Key.ImageUrl,
                    CurrentStock = g.Sum(x => x.Inventory != null ? x.Inventory.Quantity : 0)
                });

            if (request.LowStockOnly == true)
                productQuery = productQuery.Where(p => p.CurrentStock <= p.MinStock);

            var totalCount = await productQuery.CountAsync();

            var items = await productQuery
                .OrderByDescending(p => p.Id)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var categoryIds = items.Where(i => i.CategoryId.HasValue).Select(i => i.CategoryId!.Value).Distinct().ToList();
            var unitIds = items.Where(i => i.UnitId.HasValue).Select(i => i.UnitId!.Value).Distinct().ToList();

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

            var dtos = items.Select(p => new ProductDto(
                p.Id, p.Barcode, p.SKU, p.Name, p.Description,
                p.CategoryId,
                p.CategoryId.HasValue && categories.ContainsKey(p.CategoryId.Value) ? categories[p.CategoryId.Value] : null,
                p.UnitId,
                p.UnitId.HasValue && units.ContainsKey(p.UnitId.Value) ? units[p.UnitId.Value] : null,
                p.CostPrice, p.RetailPrice, p.HalfWholesalePrice, p.WholesalePrice, p.Price4,
                (int)p.MinStock, p.CurrentStock, p.IsActive, p.TaxRate, p.ImageUrl
            )).ToList();

            var result = new PagedResult<ProductDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = request.Page,
                PageSize = request.PageSize
            };

            return Result<PagedResult<ProductDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<ProductDto>>.Failure($"خطأ أثناء البحث: {ex.Message}");
        }
    }

    public async Task<Result<ProductDto>> GetByIdAsync(int id)
    {
        try
        {
            var dto = await BuildProductDto(id);
            if (dto is null)
                return Result<ProductDto>.Failure("المنتج غير موجود");
            return Result<ProductDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<ProductDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ProductDto>> GetByBarcodeAsync(string barcode)
    {
        try
        {
            var product = await _uow.Repository<Product>().Query()
                .FirstOrDefaultAsync(p =>
                    p.TenantId == _tenant.TenantId &&
                    p.Barcode == barcode &&
                    !p.IsDeleted);

            if (product is null)
                return Result<ProductDto>.Failure("المنتج غير موجود");

            var dto = await BuildProductDto(product.Id);
            return Result<ProductDto>.Success(dto!);
        }
        catch (Exception ex)
        {
            return Result<ProductDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ProductDto>> UpdateAsync(int id, UpdateProductRequest request)
    {
        try
        {
            var product = await _uow.Repository<Product>().Query()
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.TenantId == _tenant.TenantId &&
                    !p.IsDeleted);

            if (product is null)
                return Result<ProductDto>.Failure("المنتج غير موجود");

            if (!string.IsNullOrEmpty(request.Barcode) && request.Barcode != product.Barcode)
            {
                var barcodeExists = await _uow.Repository<Product>().AnyAsync(p =>
                    p.TenantId == _tenant.TenantId &&
                    p.Barcode == request.Barcode &&
                    p.Id != id &&
                    !p.IsDeleted);

                if (barcodeExists)
                    return Result<ProductDto>.Failure("الباركود مستخدم لمنتج آخر");
            }

            product.Barcode = request.Barcode;
            product.Name = request.Name;
            product.Description = request.Description;
            product.CategoryId = request.CategoryId;
            product.UnitId = request.UnitId;
            product.CostPrice = request.CostPrice;
            product.RetailPrice = request.RetailPrice;
            product.HalfWholesalePrice = request.HalfWholesalePrice;
            product.WholesalePrice = request.WholesalePrice;
            product.Price4 = request.Price4;
            product.MinStock = request.MinStock;
            product.TaxRate = request.TaxRate;
            product.UpdatedAt = DateTime.UtcNow;

            _uow.Repository<Product>().Update(product);
            await _uow.SaveChangesAsync();

            var dto = await BuildProductDto(product.Id);
            return Result<ProductDto>.Success(dto!, "تم تحديث المنتج بنجاح");
        }
        catch (Exception ex)
        {
            return Result<ProductDto>.Failure($"خطأ أثناء تحديث المنتج: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var product = await _uow.Repository<Product>().Query()
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.TenantId == _tenant.TenantId &&
                    !p.IsDeleted);

            if (product is null)
                return Result<bool>.Failure("المنتج غير موجود");

            product.IsDeleted = true;
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<Product>().Update(product);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم حذف المنتج بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ أثناء حذف المنتج: {ex.Message}");
        }
    }

    public async Task<Result<List<LowStockProductDto>>> GetLowStockAsync()
    {
        try
        {
            var lowStock = await _uow.Repository<Product>().Query()
                .Where(p => p.TenantId == _tenant.TenantId && !p.IsDeleted && p.IsActive && p.TrackInventory)
                .GroupJoin(
                    _uow.Repository<Inventory>().Query()
                        .Where(i => i.TenantId == _tenant.TenantId),
                    p => p.Id,
                    i => i.ProductId,
                    (p, inventories) => new { Product = p, Inventories = inventories })
                .SelectMany(
                    x => x.Inventories.DefaultIfEmpty(),
                    (x, inv) => new { x.Product, Inventory = inv })
                .GroupBy(x => new
                {
                    x.Product.Id,
                    x.Product.Name,
                    x.Product.Barcode,
                    x.Product.MinStock
                })
                .Select(g => new
                {
                    g.Key.Id,
                    g.Key.Name,
                    g.Key.Barcode,
                    Quantity = g.Sum(x => x.Inventory != null ? x.Inventory.Quantity : 0),
                    g.Key.MinStock
                })
                .Where(x => x.Quantity <= x.MinStock)
                .OrderBy(x => x.Quantity)
                .ToListAsync();

            var result = lowStock.Select(p => new LowStockProductDto(
                p.Id, p.Name, p.Barcode, p.Quantity, (int)p.MinStock
            )).ToList();

            return Result<List<LowStockProductDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<List<LowStockProductDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    private async Task<ProductDto?> BuildProductDto(int productId)
    {
        var product = await _uow.Repository<Product>().Query()
            .FirstOrDefaultAsync(p =>
                p.Id == productId &&
                p.TenantId == _tenant.TenantId &&
                !p.IsDeleted);

        if (product is null) return null;

        var stock = await _uow.Repository<Inventory>().Query()
            .Where(i => i.TenantId == _tenant.TenantId && i.ProductId == productId)
            .SumAsync(i => i.Quantity);

        string? categoryName = null;
        if (product.CategoryId.HasValue)
        {
            var cat = await _uow.Repository<Category>().GetByIdAsync(product.CategoryId.Value);
            categoryName = cat?.Name;
        }

        string? unitName = null;
        if (product.UnitId.HasValue)
        {
            var unit = await _uow.Repository<Unit>().GetByIdAsync(product.UnitId.Value);
            unitName = unit?.Name;
        }

        return new ProductDto(
            product.Id, product.Barcode, product.SKU, product.Name, product.Description,
            product.CategoryId, categoryName,
            product.UnitId, unitName,
            product.CostPrice, product.RetailPrice, product.HalfWholesalePrice,
            product.WholesalePrice, product.Price4,
            (int)product.MinStock, stock, product.IsActive, product.TaxRate, product.ImageUrl);
    }
}

// ════════════════════════════════════════════════════════════════
// 3. InvoiceService
// ════════════════════════════════════════════════════════════════

