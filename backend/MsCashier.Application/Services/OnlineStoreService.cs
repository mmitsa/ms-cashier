using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Application.Services.Accounting.Posting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ============================================================
// Online Store Service (authenticated admin)
// ============================================================

public class OnlineStoreService : IOnlineStoreService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly IEncryptionService _encryption;
    private readonly ISalePostingService _salePostingService;
    private readonly IPostingFailureLogger _postingFailureLogger;

    public OnlineStoreService(
        IUnitOfWork uow,
        ICurrentTenantService tenant,
        IEncryptionService encryption,
        ISalePostingService salePostingService,
        IPostingFailureLogger postingFailureLogger)
    {
        _uow = uow;
        _tenant = tenant;
        _encryption = encryption;
        _salePostingService = salePostingService;
        _postingFailureLogger = postingFailureLogger;
    }

    public async Task<Result<OnlineStoreDto>> GetStoreAsync()
    {
        var store = await _uow.Repository<OnlineStore>().Query()
            .FirstOrDefaultAsync(s => s.TenantId == _tenant.TenantId && !s.IsDeleted);

        if (store is null)
            return Result<OnlineStoreDto>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        return Result<OnlineStoreDto>.Success(MapStore(store));
    }

    public async Task<Result<OnlineStoreDto>> CreateOrUpdateStoreAsync(CreateOnlineStoreRequest request)
    {
        var subdomain = request.Subdomain.Trim().ToLowerInvariant();

        // Validate subdomain uniqueness across all tenants
        var existing = await _uow.Repository<OnlineStore>().QueryUnfiltered()
            .AnyAsync(s => s.Subdomain == subdomain && s.TenantId != _tenant.TenantId && !s.IsDeleted);
        if (existing)
            return Result<OnlineStoreDto>.Failure("النطاق الفرعي مستخدم بالفعل من متجر آخر");

        var store = await _uow.Repository<OnlineStore>().Query()
            .FirstOrDefaultAsync(s => s.TenantId == _tenant.TenantId && !s.IsDeleted);

        if (store is null)
        {
            store = new OnlineStore
            {
                TenantId = _tenant.TenantId,
                Subdomain = subdomain,
                CustomDomain = request.CustomDomain,
                IsActive = request.IsActive,
                IsPublished = request.IsPublished,
                ThemeId = request.ThemeId ?? "modern-retail",
                ThemeSettings = request.ThemeSettings,
                LogoUrl = request.LogoUrl,
                FaviconUrl = request.FaviconUrl,
                MetaTitle = request.MetaTitle,
                MetaDescription = request.MetaDescription,
                GoogleAnalyticsId = request.GoogleAnalyticsId,
                FacebookPixelId = request.FacebookPixelId,
                CustomCss = request.CustomCss
            };
            await _uow.Repository<OnlineStore>().AddAsync(store);
        }
        else
        {
            store.Subdomain = subdomain;
            store.CustomDomain = request.CustomDomain;
            store.IsActive = request.IsActive;
            store.IsPublished = request.IsPublished;
            store.ThemeId = request.ThemeId ?? store.ThemeId;
            store.ThemeSettings = request.ThemeSettings ?? store.ThemeSettings;
            store.LogoUrl = request.LogoUrl ?? store.LogoUrl;
            store.FaviconUrl = request.FaviconUrl ?? store.FaviconUrl;
            store.MetaTitle = request.MetaTitle ?? store.MetaTitle;
            store.MetaDescription = request.MetaDescription ?? store.MetaDescription;
            store.GoogleAnalyticsId = request.GoogleAnalyticsId ?? store.GoogleAnalyticsId;
            store.FacebookPixelId = request.FacebookPixelId ?? store.FacebookPixelId;
            store.CustomCss = request.CustomCss ?? store.CustomCss;
            store.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<OnlineStore>().Update(store);
        }

        await _uow.SaveChangesAsync();
        return Result<OnlineStoreDto>.Success(MapStore(store), "تم حفظ إعدادات المتجر بنجاح");
    }

    // ── Banners ──────────────────────────────────────────────

    public async Task<Result<List<StoreBannerDto>>> GetBannersAsync()
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<List<StoreBannerDto>>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        var banners = await _uow.Repository<StoreBanner>().Query()
            .Where(b => b.OnlineStoreId == store.Id && !b.IsDeleted)
            .OrderBy(b => b.SortOrder)
            .ToListAsync();

        return Result<List<StoreBannerDto>>.Success(banners.Select(MapBanner).ToList());
    }

    public async Task<Result<StoreBannerDto>> SaveBannerAsync(StoreBannerDto dto)
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<StoreBannerDto>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        StoreBanner banner;
        if (dto.Id > 0)
        {
            banner = (await _uow.Repository<StoreBanner>().GetByIdAsync(dto.Id))!;
            if (banner is null || banner.OnlineStoreId != store.Id)
                return Result<StoreBannerDto>.Failure("البانر غير موجود");

            banner.ImageUrl = dto.ImageUrl;
            banner.MobileImageUrl = dto.MobileImageUrl;
            banner.Title = dto.Title;
            banner.TitleAr = dto.TitleAr;
            banner.Subtitle = dto.Subtitle;
            banner.LinkUrl = dto.LinkUrl;
            banner.SortOrder = dto.SortOrder;
            banner.IsActive = dto.IsActive;
            banner.StartsAt = dto.StartsAt;
            banner.EndsAt = dto.EndsAt;
            banner.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<StoreBanner>().Update(banner);
        }
        else
        {
            banner = new StoreBanner
            {
                TenantId = _tenant.TenantId,
                OnlineStoreId = store.Id,
                ImageUrl = dto.ImageUrl,
                MobileImageUrl = dto.MobileImageUrl,
                Title = dto.Title,
                TitleAr = dto.TitleAr,
                Subtitle = dto.Subtitle,
                LinkUrl = dto.LinkUrl,
                SortOrder = dto.SortOrder,
                IsActive = dto.IsActive,
                StartsAt = dto.StartsAt,
                EndsAt = dto.EndsAt
            };
            await _uow.Repository<StoreBanner>().AddAsync(banner);
        }

        await _uow.SaveChangesAsync();
        return Result<StoreBannerDto>.Success(MapBanner(banner), "تم حفظ البانر بنجاح");
    }

    public async Task<Result<bool>> DeleteBannerAsync(int bannerId)
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<bool>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        var banner = await _uow.Repository<StoreBanner>().GetByIdAsync(bannerId);
        if (banner is null || banner.OnlineStoreId != store.Id)
            return Result<bool>.Failure("البانر غير موجود");

        banner.IsDeleted = true;
        banner.UpdatedAt = DateTime.UtcNow;
        _uow.Repository<StoreBanner>().Update(banner);
        await _uow.SaveChangesAsync();

        return Result<bool>.Success(true, "تم حذف البانر بنجاح");
    }

    // ── Orders ───────────────────────────────────────────────

    public async Task<Result<PagedResult<OnlineOrderDto>>> GetOrdersAsync(int page, int pageSize, OnlineOrderStatus? status)
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<PagedResult<OnlineOrderDto>>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        IQueryable<OnlineOrder> query = _uow.Repository<OnlineOrder>().Query()
            .Include(o => o.Items)
            .Where(o => o.OnlineStoreId == store.Id && !o.IsDeleted);

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        var totalCount = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<OnlineOrderDto>
        {
            Items = orders.Select(MapOrder).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };

        return Result<PagedResult<OnlineOrderDto>>.Success(result);
    }

    public async Task<Result<OnlineOrderDto>> GetOrderByIdAsync(long orderId)
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<OnlineOrderDto>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        var order = await _uow.Repository<OnlineOrder>().Query()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.OnlineStoreId == store.Id && !o.IsDeleted);

        if (order is null)
            return Result<OnlineOrderDto>.Failure("الطلب غير موجود");

        return Result<OnlineOrderDto>.Success(MapOrder(order));
    }

    public async Task<Result<OnlineOrderDto>> UpdateOrderStatusAsync(long orderId, UpdateOrderStatusRequest request)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var store = await GetCurrentStoreAsync();
            if (store is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<OnlineOrderDto>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");
            }

            var order = await _uow.Repository<OnlineOrder>().Query()
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.OnlineStoreId == store.Id && !o.IsDeleted);

            if (order is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<OnlineOrderDto>.Failure("الطلب غير موجود");
            }

            order.Status = request.Status;
            order.UpdatedAt = DateTime.UtcNow;

            long? newlyCreatedInvoiceId = null;
            // When confirmed, create a POS invoice automatically
            if (request.Status == OnlineOrderStatus.Confirmed && order.InvoiceId is null)
            {
                var warehouse = await _uow.Repository<Warehouse>().Query()
                    .FirstOrDefaultAsync(w => w.IsMain && !w.IsDeleted);

                if (warehouse is not null)
                {
                    // Look up the gateway transaction for this order (if any) so we can
                    // derive the correct PaymentMethod and route the GL entry to the
                    // right account (e.g. 1120 card clearing) instead of a bank transfer.
                    OnlinePayment? payment = null;
                    PaymentGatewayConfig? gatewayConfig = null;
                    if (!string.IsNullOrWhiteSpace(order.PaymentReference))
                    {
                        payment = await _uow.Repository<OnlinePayment>().Query()
                            .FirstOrDefaultAsync(p =>
                                (p.GatewayTransactionId == order.PaymentReference
                                 || p.GatewayReferenceId == order.PaymentReference)
                                && !p.IsDeleted);
                    }
                    if (payment is null && order.InvoiceId is long existingInvId)
                    {
                        payment = await _uow.Repository<OnlinePayment>().Query()
                            .FirstOrDefaultAsync(p => p.InvoiceId == existingInvId && !p.IsDeleted);
                    }
                    if (payment is not null)
                    {
                        gatewayConfig = await _uow.Repository<PaymentGatewayConfig>().Query()
                            .FirstOrDefaultAsync(g => g.Id == payment.GatewayConfigId && !g.IsDeleted);
                    }

                    var invoiceNumber = $"ONL-{order.OrderNumber}";
                    var invoice = new Invoice
                    {
                        TenantId = _tenant.TenantId,
                        InvoiceNumber = invoiceNumber,
                        InvoiceType = InvoiceType.Sale,
                        InvoiceDate = DateTime.UtcNow,
                        ContactId = order.ContactId,
                        WarehouseId = warehouse.Id,
                        SubTotal = order.Subtotal,
                        DiscountAmount = order.DiscountAmount,
                        TaxAmount = order.TaxAmount,
                        TotalAmount = order.TotalAmount,
                        PaidAmount = order.PaymentStatus == OnlinePaymentStatus.Paid ? order.TotalAmount : 0,
                        DueAmount = order.PaymentStatus == OnlinePaymentStatus.Paid ? 0 : order.TotalAmount,
                        PaymentMethod = DeriveInvoicePaymentMethod(order, payment, gatewayConfig),
                        PaymentStatus = order.PaymentStatus == OnlinePaymentStatus.Paid
                            ? Domain.Enums.PaymentStatus.Paid
                            : Domain.Enums.PaymentStatus.Unpaid,
                        Notes = $"طلب إلكتروني رقم {order.OrderNumber}",
                        CreatedBy = Guid.Empty
                    };
                    await _uow.Repository<Invoice>().AddAsync(invoice);
                    await _uow.SaveChangesAsync();

                    // Add invoice items
                    foreach (var item in order.Items)
                    {
                        var invoiceItem = new InvoiceItem
                        {
                            InvoiceId = invoice.Id,
                            ProductId = item.ProductId,
                            ProductVariantId = item.ProductVariantId,
                            Quantity = item.Quantity,
                            UnitPrice = item.UnitPrice,
                            CostPrice = 0,
                            DiscountAmount = 0,
                            TaxAmount = 0,
                            TotalPrice = item.TotalPrice
                        };
                        await _uow.Repository<InvoiceItem>().AddAsync(invoiceItem);
                    }

                    order.InvoiceId = invoice.Id;
                    newlyCreatedInvoiceId = invoice.Id;
                }
            }

            _uow.Repository<OnlineOrder>().Update(order);
            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            // GL posting (outside the tx; failures are logged, never roll back the order).
            // OnlineStoreService bypasses InvoiceService when auto-creating the invoice,
            // so the posting hook must fire here.
            if (newlyCreatedInvoiceId is long newInvoiceId)
            {
                try
                {
                    var postResult = await _salePostingService.PostSaleAsync(newInvoiceId);
                    if (!postResult.IsSuccess)
                    {
                        try { await _postingFailureLogger.LogAsync("Invoice", newInvoiceId, "Sale", string.Join("; ", postResult.Errors)); } catch { }
                    }
                }
                catch (Exception postEx)
                {
                    try { await _postingFailureLogger.LogAsync("Invoice", newInvoiceId, "Sale", postEx); } catch { }
                }
            }

            return Result<OnlineOrderDto>.Success(MapOrder(order), "تم تحديث حالة الطلب بنجاح");
        }
        catch
        {
            await _uow.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<Result<OnlineOrderDto>> LinkOrderToInvoiceAsync(long orderId, long invoiceId)
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<OnlineOrderDto>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        var order = await _uow.Repository<OnlineOrder>().Query()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.OnlineStoreId == store.Id && !o.IsDeleted);
        if (order is null)
            return Result<OnlineOrderDto>.Failure("الطلب غير موجود");

        var invoice = await _uow.Repository<Invoice>().GetByIdAsync(invoiceId);
        if (invoice is null)
            return Result<OnlineOrderDto>.Failure("الفاتورة غير موجودة");

        order.InvoiceId = invoiceId;
        order.UpdatedAt = DateTime.UtcNow;
        _uow.Repository<OnlineOrder>().Update(order);
        await _uow.SaveChangesAsync();

        return Result<OnlineOrderDto>.Success(MapOrder(order), "تم ربط الطلب بالفاتورة بنجاح");
    }

    // ── Payment Configs ──────────────────────────────────────

    public async Task<Result<List<OnlinePaymentConfigDto>>> GetPaymentConfigsAsync()
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<List<OnlinePaymentConfigDto>>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        var configs = await _uow.Repository<OnlinePaymentConfig>().Query()
            .Where(c => c.OnlineStoreId == store.Id && !c.IsDeleted)
            .ToListAsync();

        return Result<List<OnlinePaymentConfigDto>>.Success(configs.Select(c => MapPaymentConfig(c, _encryption)).ToList());
    }

    public async Task<Result<OnlinePaymentConfigDto>> SavePaymentConfigAsync(OnlinePaymentConfigDto dto)
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<OnlinePaymentConfigDto>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        OnlinePaymentConfig config;
        if (dto.Id > 0)
        {
            config = (await _uow.Repository<OnlinePaymentConfig>().GetByIdAsync(dto.Id))!;
            if (config is null || config.OnlineStoreId != store.Id)
                return Result<OnlinePaymentConfigDto>.Failure("إعدادات الدفع غير موجودة");

            config.Provider = dto.Provider;
            config.ApiKey = dto.ApiKey != null ? _encryption.Encrypt(dto.ApiKey) : null;
            config.SecretKey = dto.SecretKey != null ? _encryption.Encrypt(dto.SecretKey) : null;
            config.WebhookSecret = dto.WebhookSecret != null ? _encryption.Encrypt(dto.WebhookSecret) : null;
            config.Currency = dto.Currency;
            config.IsActive = dto.IsActive;
            config.IsTestMode = dto.IsTestMode;
            config.SupportedMethods = dto.SupportedMethods;
            config.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<OnlinePaymentConfig>().Update(config);
        }
        else
        {
            config = new OnlinePaymentConfig
            {
                TenantId = _tenant.TenantId,
                OnlineStoreId = store.Id,
                Provider = dto.Provider,
                ApiKey = dto.ApiKey != null ? _encryption.Encrypt(dto.ApiKey) : null,
                SecretKey = dto.SecretKey != null ? _encryption.Encrypt(dto.SecretKey) : null,
                WebhookSecret = dto.WebhookSecret != null ? _encryption.Encrypt(dto.WebhookSecret) : null,
                Currency = dto.Currency,
                IsActive = dto.IsActive,
                IsTestMode = dto.IsTestMode,
                SupportedMethods = dto.SupportedMethods
            };
            await _uow.Repository<OnlinePaymentConfig>().AddAsync(config);
        }

        await _uow.SaveChangesAsync();
        return Result<OnlinePaymentConfigDto>.Success(MapPaymentConfig(config, _encryption), "تم حفظ إعدادات الدفع بنجاح");
    }

    // ── Shipping Configs ─────────────────────────────────────

    public async Task<Result<List<StoreShippingConfigDto>>> GetShippingConfigsAsync()
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<List<StoreShippingConfigDto>>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        var configs = await _uow.Repository<StoreShippingConfig>().Query()
            .Where(c => c.OnlineStoreId == store.Id && !c.IsDeleted)
            .ToListAsync();

        return Result<List<StoreShippingConfigDto>>.Success(configs.Select(MapShippingConfig).ToList());
    }

    public async Task<Result<StoreShippingConfigDto>> SaveShippingConfigAsync(StoreShippingConfigDto dto)
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<StoreShippingConfigDto>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        StoreShippingConfig config;
        if (dto.Id > 0)
        {
            config = (await _uow.Repository<StoreShippingConfig>().GetByIdAsync(dto.Id))!;
            if (config is null || config.OnlineStoreId != store.Id)
                return Result<StoreShippingConfigDto>.Failure("إعدادات الشحن غير موجودة");

            config.ShippingType = dto.ShippingType;
            config.FlatRate = dto.FlatRate;
            config.FreeShippingMinimum = dto.FreeShippingMinimum;
            config.ZoneRates = dto.ZoneRates;
            config.IsActive = dto.IsActive;
            config.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<StoreShippingConfig>().Update(config);
        }
        else
        {
            config = new StoreShippingConfig
            {
                TenantId = _tenant.TenantId,
                OnlineStoreId = store.Id,
                ShippingType = dto.ShippingType,
                FlatRate = dto.FlatRate,
                FreeShippingMinimum = dto.FreeShippingMinimum,
                ZoneRates = dto.ZoneRates,
                IsActive = dto.IsActive
            };
            await _uow.Repository<StoreShippingConfig>().AddAsync(config);
        }

        await _uow.SaveChangesAsync();
        return Result<StoreShippingConfigDto>.Success(MapShippingConfig(config), "تم حفظ إعدادات الشحن بنجاح");
    }

    // ── Dashboard ────────────────────────────────────────────

    public async Task<Result<StoreDashboardDto>> GetDashboardAsync()
    {
        var store = await GetCurrentStoreAsync();
        if (store is null)
            return Result<StoreDashboardDto>.Failure("لم يتم إعداد المتجر الإلكتروني بعد");

        var orders = _uow.Repository<OnlineOrder>().Query()
            .Where(o => o.OnlineStoreId == store.Id && !o.IsDeleted);

        var totalOrders = await orders.CountAsync();
        var pendingOrders = await orders.CountAsync(o => o.Status == OnlineOrderStatus.Pending);
        var confirmedOrders = await orders.CountAsync(o => o.Status == OnlineOrderStatus.Confirmed);
        var deliveredOrders = await orders.CountAsync(o => o.Status == OnlineOrderStatus.Delivered);
        var cancelledOrders = await orders.CountAsync(o => o.Status == OnlineOrderStatus.Cancelled);
        var totalRevenue = await orders
            .Where(o => o.Status != OnlineOrderStatus.Cancelled)
            .SumAsync(o => o.TotalAmount);

        var today = DateTime.UtcNow.Date;
        var todayOrders = await orders.CountAsync(o => o.CreatedAt >= today);
        var todayRevenue = await orders
            .Where(o => o.CreatedAt >= today && o.Status != OnlineOrderStatus.Cancelled)
            .SumAsync(o => o.TotalAmount);

        return Result<StoreDashboardDto>.Success(new StoreDashboardDto(
            totalOrders, pendingOrders, confirmedOrders, deliveredOrders, cancelledOrders,
            totalRevenue, todayRevenue, todayOrders));
    }

    // ── Helpers ──────────────────────────────────────────────

    private async Task<OnlineStore?> GetCurrentStoreAsync() =>
        await _uow.Repository<OnlineStore>().Query()
            .FirstOrDefaultAsync(s => s.TenantId == _tenant.TenantId && !s.IsDeleted);

    private static OnlineStoreDto MapStore(OnlineStore s) => new(
        s.Id, s.Subdomain, s.CustomDomain, s.IsActive, s.IsPublished,
        s.ThemeId, s.ThemeSettings, s.LogoUrl, s.FaviconUrl,
        s.MetaTitle, s.MetaDescription,
        s.GoogleAnalyticsId, s.FacebookPixelId, s.CustomCss);

    private static StoreBannerDto MapBanner(StoreBanner b) => new(
        b.Id, b.OnlineStoreId, b.ImageUrl, b.MobileImageUrl,
        b.Title, b.TitleAr, b.Subtitle, b.LinkUrl,
        b.SortOrder, b.IsActive, b.StartsAt, b.EndsAt);

    private static OnlineOrderDto MapOrder(OnlineOrder o) => new(
        o.Id, o.OnlineStoreId, o.OrderNumber,
        o.ContactId, o.CustomerName, o.CustomerPhone, o.CustomerEmail,
        o.ShippingAddress, o.Subtotal, o.TaxAmount, o.ShippingFee,
        o.DiscountAmount, o.TotalAmount,
        o.Status, o.PaymentStatus,
        o.PaymentMethod, o.PaymentReference,
        o.InvoiceId, o.IsPrintedForPreparation, o.PrintedAt,
        o.OrderType, o.DeliveryNotes, o.EstimatedDeliveryAt,
        o.CreatedAt, o.Items.Select(MapOrderItem).ToList());

    private static OnlineOrderItemDto MapOrderItem(OnlineOrderItem i) => new(
        i.Id, i.ProductId, i.ProductVariantId,
        i.ProductName, i.VariantDescription,
        i.Quantity, i.UnitPrice, i.TotalPrice, i.Notes);

    private static OnlinePaymentConfigDto MapPaymentConfig(OnlinePaymentConfig c, IEncryptionService encryption) => new(
        c.Id, c.OnlineStoreId, c.Provider,
        c.ApiKey != null ? encryption.Decrypt(c.ApiKey) : null,
        c.SecretKey != null ? encryption.Decrypt(c.SecretKey) : null,
        c.WebhookSecret != null ? encryption.Decrypt(c.WebhookSecret) : null,
        c.Currency, c.IsActive, c.IsTestMode, c.SupportedMethods);

    private static StoreShippingConfigDto MapShippingConfig(StoreShippingConfig c) => new(
        c.Id, c.OnlineStoreId, c.ShippingType,
        c.FlatRate, c.FreeShippingMinimum, c.ZoneRates, c.IsActive);

    // Derive the POS PaymentMethod for an invoice auto-created from an online order.
    // The routing into the GL (e.g. 1120 card-clearing) happens downstream in
    // SalePostingService based on this enum value, so it must reflect the real
    // customer payment channel rather than a hard-coded bank transfer.
    private static PaymentMethod DeriveInvoicePaymentMethod(
        OnlineOrder order,
        OnlinePayment? payment,
        PaymentGatewayConfig? gatewayConfig)
    {
        // 1) Honor explicit hints on the order itself (free-form string set by storefront).
        //    Typical values: "cash", "cod", "card", "visa", "mada", "applepay", "stcpay",
        //    "instapay", "banktransfer", "tabby", "tamara", "valu".
        var hint = (order.PaymentMethod ?? payment?.PaymentMethod ?? string.Empty)
            .Trim()
            .ToLowerInvariant();
        if (hint.Length > 0)
        {
            if (hint.Contains("cod") || hint.Contains("cash_on_delivery") || hint == "cash")
                return PaymentMethod.Cash;
            if (hint.Contains("tabby")) return PaymentMethod.Tabby;
            if (hint.Contains("tamara")) return PaymentMethod.Tamara;
            if (hint.Contains("valu")) return PaymentMethod.ValU;
            if (hint.Contains("installment")) return PaymentMethod.Installment;
            if (hint.Contains("instapay") || hint.Contains("stcpay") || hint.Contains("stc_pay")
                || hint.Contains("applepay") || hint.Contains("apple_pay")
                || hint.Contains("googlepay") || hint.Contains("google_pay")
                || hint.Contains("wallet"))
                return PaymentMethod.Instapay;
            if (hint.Contains("bank") || hint.Contains("transfer") || hint.Contains("wire"))
                return PaymentMethod.BankTransfer;
            if (hint.Contains("card") || hint.Contains("visa") || hint.Contains("master")
                || hint.Contains("mada") || hint.Contains("credit") || hint.Contains("debit"))
                return PaymentMethod.Visa;
        }

        // 2) Fall back to the gateway type recorded on the OnlinePayment.
        var gatewayType = payment?.GatewayType ?? gatewayConfig?.GatewayType;
        if (gatewayType.HasValue)
        {
            return gatewayType.Value switch
            {
                PaymentGatewayType.Moyasar => PaymentMethod.Visa,
                PaymentGatewayType.Tap => PaymentMethod.Visa,
                PaymentGatewayType.HyperPay => PaymentMethod.Visa,
                PaymentGatewayType.PayTabs => PaymentMethod.Visa,
                PaymentGatewayType.Stripe => PaymentMethod.Visa,
                PaymentGatewayType.Tabby => PaymentMethod.Tabby,
                // TODO: map future gateway types (Tamara, STC Pay, Checkout.com, etc.) explicitly.
                _ => PaymentMethod.BankTransfer,
            };
        }

        // 3) Unknown — preserve the prior default so behavior is a strict superset.
        return PaymentMethod.BankTransfer;
    }
}
