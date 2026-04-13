using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ============================================================
// Storefront Service (PUBLIC — no authentication)
// ============================================================

public class StorefrontService : IStorefrontService
{
    private readonly IUnitOfWork _uow;
    public StorefrontService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<OnlineStoreDto>> GetStoreBySubdomainAsync(string subdomain)
    {
        var store = await _uow.Repository<OnlineStore>().QueryUnfiltered()
            .FirstOrDefaultAsync(s => s.Subdomain == subdomain && s.IsActive && s.IsPublished && !s.IsDeleted);

        if (store is null)
            return Result<OnlineStoreDto>.Failure("المتجر غير موجود أو غير منشور");

        return Result<OnlineStoreDto>.Success(new OnlineStoreDto(
            store.Id, store.Subdomain, store.CustomDomain, store.IsActive, store.IsPublished,
            store.ThemeId, store.ThemeSettings, store.LogoUrl, store.FaviconUrl,
            store.MetaTitle, store.MetaDescription,
            store.GoogleAnalyticsId, store.FacebookPixelId, store.CustomCss));
    }

    public async Task<Result<PagedResult<StorefrontProductDto>>> GetProductsAsync(
        int storeId, int? categoryId, string? search, int page, int pageSize)
    {
        var store = await GetStoreOrNull(storeId);
        if (store is null)
            return Result<PagedResult<StorefrontProductDto>>.Failure("المتجر غير موجود");

        IQueryable<Product> query = _uow.Repository<Product>().QueryUnfiltered()
            .Include(p => p.Category)
            .Where(p => p.TenantId == store.TenantId && !p.IsDeleted && p.IsActive);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || (p.Barcode != null && p.Barcode.Contains(search)));

        var totalCount = await query.CountAsync();
        var products = await query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<StorefrontProductDto>
        {
            Items = products.Select(p => new StorefrontProductDto(
                p.Id, p.Name, p.Description, p.ImageUrl,
                p.RetailPrice, p.TaxRate, p.CategoryId, p.Category?.Name,
                p.Barcode, p.SKU)).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };

        return Result<PagedResult<StorefrontProductDto>>.Success(result);
    }

    public async Task<Result<StorefrontProductDto>> GetProductByIdAsync(int storeId, int productId)
    {
        var store = await GetStoreOrNull(storeId);
        if (store is null)
            return Result<StorefrontProductDto>.Failure("المتجر غير موجود");

        var product = await _uow.Repository<Product>().QueryUnfiltered()
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == productId && p.TenantId == store.TenantId && !p.IsDeleted && p.IsActive);

        if (product is null)
            return Result<StorefrontProductDto>.Failure("المنتج غير موجود");

        return Result<StorefrontProductDto>.Success(new StorefrontProductDto(
            product.Id, product.Name, product.Description, product.ImageUrl,
            product.RetailPrice, product.TaxRate, product.CategoryId, product.Category?.Name,
            product.Barcode, product.SKU));
    }

    public async Task<Result<List<StorefrontCategoryDto>>> GetCategoriesAsync(int storeId)
    {
        var store = await GetStoreOrNull(storeId);
        if (store is null)
            return Result<List<StorefrontCategoryDto>>.Failure("المتجر غير موجود");

        var categories = await _uow.Repository<Category>().QueryUnfiltered()
            .Where(c => c.TenantId == store.TenantId && !c.IsDeleted)
            .ToListAsync();

        var products = _uow.Repository<Product>().QueryUnfiltered()
            .Where(p => p.TenantId == store.TenantId && !p.IsDeleted && p.IsActive);

        var result = new List<StorefrontCategoryDto>();
        foreach (var cat in categories.OrderBy(c => c.Name))
        {
            var count = await products.CountAsync(p => p.CategoryId == cat.Id);
            if (count > 0)
                result.Add(new StorefrontCategoryDto(cat.Id, cat.Name, count));
        }

        return Result<List<StorefrontCategoryDto>>.Success(result);
    }

    public async Task<Result<List<StoreBannerDto>>> GetBannersAsync(int storeId)
    {
        var store = await GetStoreOrNull(storeId);
        if (store is null)
            return Result<List<StoreBannerDto>>.Failure("المتجر غير موجود");

        var now = DateTime.UtcNow;
        var banners = await _uow.Repository<StoreBanner>().QueryUnfiltered()
            .Where(b => b.OnlineStoreId == storeId && b.IsActive && !b.IsDeleted
                && (!b.StartsAt.HasValue || b.StartsAt <= now)
                && (!b.EndsAt.HasValue || b.EndsAt >= now))
            .OrderBy(b => b.SortOrder)
            .ToListAsync();

        return Result<List<StoreBannerDto>>.Success(banners.Select(b => new StoreBannerDto(
            b.Id, b.OnlineStoreId, b.ImageUrl, b.MobileImageUrl,
            b.Title, b.TitleAr, b.Subtitle, b.LinkUrl,
            b.SortOrder, b.IsActive, b.StartsAt, b.EndsAt)).ToList());
    }

    public async Task<Result<OnlineOrderDto>> CreateOrderAsync(int storeId, CreateOnlineOrderRequest request)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var store = await GetStoreOrNull(storeId);
            if (store is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<OnlineOrderDto>.Failure("المتجر غير موجود");
            }

            if (request.Items is null || request.Items.Count == 0)
            {
                await _uow.RollbackTransactionAsync();
                return Result<OnlineOrderDto>.Failure("يجب إضافة منتج واحد على الأقل");
            }

            // Generate order number
            var orderCount = await _uow.Repository<OnlineOrder>().QueryUnfiltered()
                .CountAsync(o => o.OnlineStoreId == storeId);
            var orderNumber = $"ORD-{(orderCount + 1):D6}";

            decimal subtotal = 0;
            var orderItems = new List<OnlineOrderItem>();

            foreach (var item in request.Items)
            {
                var product = await _uow.Repository<Product>().QueryUnfiltered()
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.TenantId == store.TenantId && !p.IsDeleted && p.IsActive);

                if (product is null)
                {
                    await _uow.RollbackTransactionAsync();
                    return Result<OnlineOrderDto>.Failure($"المنتج رقم {item.ProductId} غير موجود أو غير متاح");
                }

                var totalPrice = product.RetailPrice * item.Quantity;
                subtotal += totalPrice;

                orderItems.Add(new OnlineOrderItem
                {
                    TenantId = store.TenantId,
                    ProductId = product.Id,
                    ProductVariantId = item.ProductVariantId,
                    ProductName = product.Name,
                    Quantity = item.Quantity,
                    UnitPrice = product.RetailPrice,
                    TotalPrice = totalPrice,
                    Notes = item.Notes
                });
            }

            // Calculate shipping
            decimal shippingFee = 0;
            if (request.OrderType == OnlineOrderType.Delivery)
            {
                var shippingConfig = await _uow.Repository<StoreShippingConfig>().QueryUnfiltered()
                    .FirstOrDefaultAsync(c => c.OnlineStoreId == storeId && c.IsActive && !c.IsDeleted);

                if (shippingConfig is not null)
                {
                    if (shippingConfig.ShippingType == "free" ||
                        (shippingConfig.ShippingType == "flat_rate" && shippingConfig.FreeShippingMinimum.HasValue && subtotal >= shippingConfig.FreeShippingMinimum.Value))
                    {
                        shippingFee = 0;
                    }
                    else if (shippingConfig.ShippingType == "flat_rate" && shippingConfig.FlatRate.HasValue)
                    {
                        shippingFee = shippingConfig.FlatRate.Value;
                    }
                }
            }

            var totalAmount = subtotal + shippingFee;

            var order = new OnlineOrder
            {
                TenantId = store.TenantId,
                OnlineStoreId = storeId,
                OrderNumber = orderNumber,
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                CustomerEmail = request.CustomerEmail,
                ShippingAddress = request.ShippingAddress,
                Subtotal = subtotal,
                TaxAmount = 0,
                ShippingFee = shippingFee,
                DiscountAmount = 0,
                TotalAmount = totalAmount,
                Status = OnlineOrderStatus.Pending,
                PaymentStatus = OnlinePaymentStatus.Pending,
                PaymentMethod = request.PaymentMethod,
                OrderType = request.OrderType,
                DeliveryNotes = request.DeliveryNotes
            };

            await _uow.Repository<OnlineOrder>().AddAsync(order);
            await _uow.SaveChangesAsync();

            foreach (var item in orderItems)
            {
                item.OnlineOrderId = order.Id;
                await _uow.Repository<OnlineOrderItem>().AddAsync(item);
            }

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            // Reload with items
            var savedOrder = await _uow.Repository<OnlineOrder>().QueryUnfiltered()
                .Include(o => o.Items)
                .FirstAsync(o => o.Id == order.Id);

            return Result<OnlineOrderDto>.Success(new OnlineOrderDto(
                savedOrder.Id, savedOrder.OnlineStoreId, savedOrder.OrderNumber,
                savedOrder.ContactId, savedOrder.CustomerName, savedOrder.CustomerPhone, savedOrder.CustomerEmail,
                savedOrder.ShippingAddress, savedOrder.Subtotal, savedOrder.TaxAmount, savedOrder.ShippingFee,
                savedOrder.DiscountAmount, savedOrder.TotalAmount,
                savedOrder.Status, savedOrder.PaymentStatus,
                savedOrder.PaymentMethod, savedOrder.PaymentReference,
                savedOrder.InvoiceId, savedOrder.IsPrintedForPreparation, savedOrder.PrintedAt,
                savedOrder.OrderType, savedOrder.DeliveryNotes, savedOrder.EstimatedDeliveryAt,
                savedOrder.CreatedAt,
                savedOrder.Items.Select(i => new OnlineOrderItemDto(
                    i.Id, i.ProductId, i.ProductVariantId,
                    i.ProductName, i.VariantDescription,
                    i.Quantity, i.UnitPrice, i.TotalPrice, i.Notes)).ToList()),
                "تم إنشاء الطلب بنجاح");
        }
        catch
        {
            await _uow.RollbackTransactionAsync();
            throw;
        }
    }

    // ── Helpers ──────────────────────────────────────────────

    private async Task<OnlineStore?> GetStoreOrNull(int storeId) =>
        await _uow.Repository<OnlineStore>().QueryUnfiltered()
            .FirstOrDefaultAsync(s => s.Id == storeId && s.IsActive && s.IsPublished && !s.IsDeleted);
}
