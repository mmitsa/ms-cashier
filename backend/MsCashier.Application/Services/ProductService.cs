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
                ReorderLevel = request.ReorderLevel,
                MaxStock = request.MaxStock,
                TaxRate = request.TaxRate,
                IsActive = true,
                TrackInventory = true,
                IsBundle = request.IsBundle,
                BundleDiscountType = request.BundleDiscountType,
                BundleDiscountValue = request.BundleDiscountValue,
                BundleHasOwnStock = request.BundleHasOwnStock,
                BundleValidFrom = request.BundleValidFrom,
                BundleValidTo = request.BundleValidTo,
                BundlePricingMode = request.BundlePricingMode,
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

            // Save bundle items if this is a bundle
            if (request.IsBundle && request.BundleItems?.Count > 0)
            {
                if (request.BundleItems.Count < 2)
                    return Result<ProductDto>.Failure("الباقة يجب أن تحتوي على صنفين على الأقل");

                var componentIds = request.BundleItems.Select(bi => bi.ComponentId).ToList();
                var components = await _uow.Repository<Product>().Query()
                    .Where(p => componentIds.Contains(p.Id))
                    .ToListAsync();

                if (components.Any(c => c.IsBundle))
                    return Result<ProductDto>.Failure("لا يمكن إضافة باقة داخل باقة أخرى");

                if (components.Count != componentIds.Count)
                    return Result<ProductDto>.Failure("بعض الأصناف المكونة غير موجودة");

                foreach (var bi in request.BundleItems)
                {
                    await _uow.Repository<BundleItem>().AddAsync(new BundleItem
                    {
                        TenantId = product.TenantId,
                        ProductId = product.Id,
                        ComponentId = bi.ComponentId,
                        Quantity = bi.Quantity,
                        SortOrder = bi.SortOrder,
                    });
                }
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
                .AsNoTracking()
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

            query = query.Where(p => !p.IsBundle
                || ((!p.BundleValidFrom.HasValue || p.BundleValidFrom <= DateTime.UtcNow)
                 && (!p.BundleValidTo.HasValue || p.BundleValidTo >= DateTime.UtcNow)));

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
                    x.Product.ReorderLevel,
                    x.Product.MaxStock,
                    x.Product.IsActive,
                    x.Product.TaxRate,
                    x.Product.ImageUrl,
                    x.Product.IsBundle,
                    x.Product.BundleDiscountType,
                    x.Product.BundleDiscountValue,
                    x.Product.BundleHasOwnStock,
                    x.Product.BundleValidFrom,
                    x.Product.BundleValidTo,
                    x.Product.BundlePricingMode
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
                    g.Key.ReorderLevel,
                    g.Key.MaxStock,
                    g.Key.IsActive,
                    g.Key.TaxRate,
                    g.Key.ImageUrl,
                    g.Key.IsBundle,
                    g.Key.BundleDiscountType,
                    g.Key.BundleDiscountValue,
                    g.Key.BundleHasOwnStock,
                    g.Key.BundleValidFrom,
                    g.Key.BundleValidTo,
                    g.Key.BundlePricingMode,
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

            // Load bundle items for bundle products
            var bundleProductIds = items.Where(p => p.IsBundle).Select(p => p.Id).ToList();
            var allBundleItems = bundleProductIds.Count > 0
                ? await _uow.Repository<BundleItem>().Query()
                    .Include(bi => bi.Component)
                    .Where(bi => bundleProductIds.Contains(bi.ProductId))
                    .OrderBy(bi => bi.SortOrder)
                    .ToListAsync()
                : new List<BundleItem>();

            var bundleItemsByProduct = allBundleItems
                .GroupBy(bi => bi.ProductId)
                .ToDictionary(g => g.Key, g => g.Select(bi => new BundleItemDto(
                    bi.Id, bi.ComponentId, bi.Component?.Name ?? "", bi.Component?.Barcode,
                    bi.Quantity, bi.SortOrder, bi.Component?.RetailPrice ?? 0, bi.Component?.CostPrice ?? 0
                )).ToList());

            var dtos = items.Select(p => new ProductDto(
                p.Id, p.Barcode, p.SKU, p.Name, p.Description,
                p.CategoryId,
                p.CategoryId.HasValue && categories.ContainsKey(p.CategoryId.Value) ? categories[p.CategoryId.Value] : null,
                p.UnitId,
                p.UnitId.HasValue && units.ContainsKey(p.UnitId.Value) ? units[p.UnitId.Value] : null,
                p.CostPrice, p.RetailPrice, p.HalfWholesalePrice, p.WholesalePrice, p.Price4,
                (int)p.MinStock, p.ReorderLevel, p.MaxStock, p.CurrentStock, p.IsActive, p.TaxRate, p.ImageUrl,
                p.IsBundle, p.BundleDiscountType, p.BundleDiscountValue, p.BundleHasOwnStock,
                p.BundleValidFrom, p.BundleValidTo, p.BundlePricingMode,
                bundleItemsByProduct.GetValueOrDefault(p.Id)
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
            product.ReorderLevel = request.ReorderLevel;
            product.MaxStock = request.MaxStock;
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
                .AsNoTracking()
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
            .Include(p => p.Category)
            .Include(p => p.Unit)
            .FirstOrDefaultAsync(p =>
                p.Id == productId &&
                p.TenantId == _tenant.TenantId &&
                !p.IsDeleted);

        if (product is null) return null;

        var stock = await _uow.Repository<Inventory>().Query()
            .Where(i => i.TenantId == _tenant.TenantId && i.ProductId == productId)
            .SumAsync(i => i.Quantity);

        // Load bundle items if this is a bundle
        List<BundleItemDto>? bundleItems = null;
        if (product.IsBundle)
        {
            var items = await _uow.Repository<BundleItem>().Query()
                .Include(bi => bi.Component)
                .Where(bi => bi.ProductId == product.Id)
                .OrderBy(bi => bi.SortOrder)
                .ToListAsync();

            bundleItems = items.Select(bi => new BundleItemDto(
                bi.Id, bi.ComponentId, bi.Component?.Name ?? "", bi.Component?.Barcode,
                bi.Quantity, bi.SortOrder, bi.Component?.RetailPrice ?? 0, bi.Component?.CostPrice ?? 0
            )).ToList();
        }

        return MapToDto(product, stock, bundleItems);
    }

    private static ProductDto MapToDto(Product p, decimal currentStock, List<BundleItemDto>? bundleItems = null) =>
        new(p.Id, p.Barcode, p.SKU, p.Name, p.Description,
            p.CategoryId, p.Category?.Name, p.UnitId, p.Unit?.Name,
            p.CostPrice, p.RetailPrice, p.HalfWholesalePrice, p.WholesalePrice, p.Price4,
            (int)p.MinStock, p.ReorderLevel, p.MaxStock, currentStock, p.IsActive, p.TaxRate, p.ImageUrl,
            p.IsBundle, p.BundleDiscountType, p.BundleDiscountValue, p.BundleHasOwnStock,
            p.BundleValidFrom, p.BundleValidTo, p.BundlePricingMode, bundleItems);

    public async Task<Result<int>> BulkUpdateAsync(BulkUpdateProductsRequest request)
    {
        try
        {
            var products = await _uow.Repository<Product>().Query()
                .Where(p => request.ProductIds.Contains(p.Id))
                .ToListAsync();
            if (!products.Any()) return Result<int>.Failure("لم يتم العثور على أي منتج");

            foreach (var p in products)
            {
                if (request.CostPrice.HasValue) p.CostPrice = request.CostPrice.Value;
                if (request.RetailPrice.HasValue) p.RetailPrice = request.RetailPrice.Value;
                if (request.CategoryId.HasValue) p.CategoryId = request.CategoryId.Value;
                if (request.IsActive.HasValue) p.IsActive = request.IsActive.Value;
            }
            await _uow.SaveChangesAsync();
            return Result<int>.Success(products.Count);
        }
        catch (Exception ex) { return Result<int>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<int>> BulkDeleteAsync(BulkDeleteProductsRequest request)
    {
        try
        {
            var products = await _uow.Repository<Product>().Query()
                .Where(p => request.ProductIds.Contains(p.Id))
                .ToListAsync();
            if (!products.Any()) return Result<int>.Failure("لم يتم العثور على أي منتج");

            foreach (var p in products) p.IsDeleted = true;
            await _uow.SaveChangesAsync();
            return Result<int>.Success(products.Count);
        }
        catch (Exception ex) { return Result<int>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<ProductDto>> UpdateBarcodeAsync(int id, string barcode)
    {
        try
        {
            var product = await _uow.Repository<Product>().Query()
                .FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return Result<ProductDto>.Failure("المنتج غير موجود");

            var trimmed = barcode?.Trim();
            if (!string.IsNullOrEmpty(trimmed))
            {
                var exists = await _uow.Repository<Product>().Query()
                    .AnyAsync(p => p.Barcode == trimmed && p.Id != id);
                if (exists) return Result<ProductDto>.Failure("هذا الباركود مستخدم بالفعل لمنتج آخر");
            }
            product.Barcode = trimmed;
            await _uow.SaveChangesAsync();
            return Result<ProductDto>.Success(await BuildProductDto(product.Id) ?? throw new InvalidOperationException());
        }
        catch (Exception ex) { return Result<ProductDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<ProductDto>> UpdatePricesAsync(int id, UpdatePricesRequest request)
    {
        try
        {
            var product = await _uow.Repository<Product>().Query()
                .FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return Result<ProductDto>.Failure("المنتج غير موجود");

            if (request.CostPrice.HasValue) product.CostPrice = request.CostPrice.Value;
            if (request.RetailPrice.HasValue) product.RetailPrice = request.RetailPrice.Value;
            await _uow.SaveChangesAsync();
            return Result<ProductDto>.Success(await BuildProductDto(product.Id) ?? throw new InvalidOperationException());
        }
        catch (Exception ex) { return Result<ProductDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<string>> UpdateImageAsync(int id, string? imageUrl)
    {
        try
        {
            var product = await _uow.Repository<Product>().Query()
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.TenantId == _tenant.TenantId &&
                    !p.IsDeleted);

            if (product is null)
                return Result<string>.Failure("المنتج غير موجود");

            product.ImageUrl = imageUrl;
            product.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<Product>().Update(product);
            await _uow.SaveChangesAsync();

            return Result<string>.Success(imageUrl ?? "", "تم تحديث صورة المنتج بنجاح");
        }
        catch (Exception ex)
        {
            return Result<string>.Failure($"خطأ أثناء تحديث صورة المنتج: {ex.Message}");
        }
    }
}

// ════════════════════════════════════════════════════════════════
// 3. InvoiceService
// ════════════════════════════════════════════════════════════════

