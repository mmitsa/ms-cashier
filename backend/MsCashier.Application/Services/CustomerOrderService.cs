using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ============================================================
// Customer Order Service (PUBLIC — no authentication)
// ============================================================

public class CustomerOrderService : ICustomerOrderService
{
    private readonly IUnitOfWork _uow;
    public CustomerOrderService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<PublicStoreInfoDto>> GetStoreMenuAsync(string qrCode)
    {
        var qr = await _uow.Repository<StoreQrConfig>().QueryUnfiltered()
            .Include(q => q.Table)
            .FirstOrDefaultAsync(q => q.Code == qrCode && q.IsActive && !q.IsDeleted);
        if (qr is null) return Result<PublicStoreInfoDto>.Failure("رمز QR غير صالح");

        var tenant = await _uow.Repository<Tenant>().QueryUnfiltered()
            .FirstOrDefaultAsync(t => t.Id == qr.TenantId);
        if (tenant is null || tenant.Status != TenantStatus.Active)
            return Result<PublicStoreInfoDto>.Failure("المتجر غير متاح حالياً");

        var categories = await _uow.Repository<Category>().QueryUnfiltered()
            .Where(c => c.TenantId == qr.TenantId && !c.IsDeleted).OrderBy(c => c.Name).ToListAsync();

        var products = await _uow.Repository<Product>().QueryUnfiltered()
            .Where(p => p.TenantId == qr.TenantId && !p.IsDeleted && p.IsActive)
            .Include(p => p.Category).OrderBy(p => p.Name).ToListAsync();

        var catDtos = categories.Select(c => new PublicCategoryDto(c.Id, c.Name,
            products.Where(p => p.CategoryId == c.Id).Select(p => new PublicProductDto(
                p.Id, p.Name, p.Description, p.RetailPrice, p.ImageUrl, p.TaxRate, p.CategoryId, c.Name)).ToList()
        )).Where(c => c.Products.Count > 0).ToList();

        var uncategorized = products.Where(p => p.CategoryId == null).ToList();
        if (uncategorized.Count > 0)
            catDtos.Insert(0, new PublicCategoryDto(0, "عام", uncategorized.Select(p => new PublicProductDto(
                p.Id, p.Name, p.Description, p.RetailPrice, p.ImageUrl, p.TaxRate, null, "عام")).ToList()));

        return Result<PublicStoreInfoDto>.Success(new PublicStoreInfoDto(
            tenant.Id, tenant.Name, tenant.LogoUrl ?? qr.LogoUrl, qr.ThemeColor,
            qr.WelcomeMessage, tenant.Address, tenant.Phone,
            qr.RequirePhone, qr.AllowCashPayment, qr.AllowOnlinePayment,
            qr.ServiceChargePercent, qr.DefaultType.ToString(),
            qr.TableId, qr.Table?.TableNumber, catDtos));
    }

    public async Task<Result<SessionDto>> StartSessionAsync(string qrCode, StartSessionRequest request)
    {
        var qr = await _uow.Repository<StoreQrConfig>().QueryUnfiltered()
            .FirstOrDefaultAsync(q => q.Code == qrCode && q.IsActive && !q.IsDeleted);
        if (qr is null) return Result<SessionDto>.Failure("رمز QR غير صالح");

        var sessionType = Enum.TryParse<QrSessionType>(request.OrderType, out var ot) ? ot : qr.DefaultType;
        var session = new CustomerSession
        {
            TenantId = qr.TenantId, QrConfigId = qr.Id, SessionType = sessionType,
            CustomerName = request.CustomerName, CustomerPhone = request.CustomerPhone,
            TableId = qr.TableId, ExpiresAt = DateTime.UtcNow.AddHours(4),
        };
        await _uow.Repository<CustomerSession>().AddAsync(session);
        await _uow.SaveChangesAsync();

        return Result<SessionDto>.Success(new SessionDto(
            session.SessionToken, session.SessionType.ToString(),
            session.CustomerName, session.TableId, session.ExpiresAt!.Value));
    }

    public async Task<Result<CustomerOrderDto>> GetCartAsync(string sessionToken)
    {
        var session = await ValidateSession(sessionToken);
        if (session is null) return Result<CustomerOrderDto>.Failure("الجلسة غير صالحة أو منتهية");

        var order = await _uow.Repository<CustomerOrder>().QueryUnfiltered()
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Where(o => o.SessionId == session.Id && (o.Status == CustomerOrderStatus.Cart || o.Status == CustomerOrderStatus.Browsing))
            .FirstOrDefaultAsync();

        if (order is null)
        {
            order = new CustomerOrder
            {
                TenantId = session.TenantId, SessionId = session.Id,
                OrderNumber = $"QR-{DateTime.UtcNow:yyMMdd}-{new Random().Next(1000, 9999)}",
                Status = CustomerOrderStatus.Cart, OrderType = session.SessionType,
                TableId = session.TableId, CustomerName = session.CustomerName, CustomerPhone = session.CustomerPhone,
            };
            await _uow.Repository<CustomerOrder>().AddAsync(order);
            await _uow.SaveChangesAsync();
        }
        return Result<CustomerOrderDto>.Success(MapOrderToDto(order));
    }

    public async Task<Result<CustomerOrderDto>> AddToCartAsync(string sessionToken, AddToCartRequest request)
    {
        var session = await ValidateSession(sessionToken);
        if (session is null) return Result<CustomerOrderDto>.Failure("الجلسة غير صالحة");

        var product = await _uow.Repository<Product>().QueryUnfiltered()
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.TenantId == session.TenantId && !p.IsDeleted && p.IsActive);
        if (product is null) return Result<CustomerOrderDto>.Failure("المنتج غير متاح");

        var order = await GetOrCreateCart(session);
        var existing = order.Items.FirstOrDefault(i => i.ProductId == request.ProductId && i.SpecialNotes == request.SpecialNotes);
        if (existing != null) { existing.Quantity += request.Quantity; existing.TotalPrice = existing.Quantity * existing.UnitPrice; }
        else
        {
            order.Items.Add(new CustomerOrderItem
            {
                OrderId = order.Id, ProductId = product.Id, Quantity = request.Quantity,
                UnitPrice = product.RetailPrice, TotalPrice = product.RetailPrice * request.Quantity,
                SpecialNotes = request.SpecialNotes,
            });
        }
        RecalculateOrder(order, session);
        await _uow.SaveChangesAsync();
        return await GetCartAsync(sessionToken);
    }

    public async Task<Result<CustomerOrderDto>> UpdateCartItemAsync(string sessionToken, long itemId, UpdateCartItemRequest request)
    {
        var session = await ValidateSession(sessionToken);
        if (session is null) return Result<CustomerOrderDto>.Failure("الجلسة غير صالحة");
        var order = await GetOrCreateCart(session);
        var item = order.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return Result<CustomerOrderDto>.Failure("العنصر غير موجود");
        item.Quantity = request.Quantity; item.TotalPrice = item.Quantity * item.UnitPrice;
        item.SpecialNotes = request.SpecialNotes;
        RecalculateOrder(order, session);
        await _uow.SaveChangesAsync();
        return await GetCartAsync(sessionToken);
    }

    public async Task<Result<CustomerOrderDto>> RemoveFromCartAsync(string sessionToken, long itemId)
    {
        var session = await ValidateSession(sessionToken);
        if (session is null) return Result<CustomerOrderDto>.Failure("الجلسة غير صالحة");
        var order = await GetOrCreateCart(session);
        var item = order.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return Result<CustomerOrderDto>.Failure("العنصر غير موجود");
        _uow.Repository<CustomerOrderItem>().Remove(item);
        order.Items.Remove(item);
        RecalculateOrder(order, session);
        await _uow.SaveChangesAsync();
        return await GetCartAsync(sessionToken);
    }

    public async Task<Result<CustomerOrderDto>> SubmitOrderAsync(string sessionToken, SubmitOrderRequest request)
    {
        var session = await ValidateSession(sessionToken);
        if (session is null) return Result<CustomerOrderDto>.Failure("الجلسة غير صالحة");
        var order = await GetOrCreateCart(session);
        if (!order.Items.Any()) return Result<CustomerOrderDto>.Failure("السلة فارغة");

        order.CustomerName = request.CustomerName ?? session.CustomerName;
        order.CustomerPhone = request.CustomerPhone ?? session.CustomerPhone;
        order.DeliveryAddress = request.DeliveryAddress;
        order.Notes = request.Notes;

        var pm = Enum.TryParse<CustomerPaymentMethod>(request.PaymentMethod, out var p) ? p : CustomerPaymentMethod.Cash;
        order.PaymentMethod = pm;
        if (pm == CustomerPaymentMethod.Cash) { order.Status = CustomerOrderStatus.Confirmed; order.ConfirmedAt = DateTime.UtcNow; }
        else { order.Status = CustomerOrderStatus.PendingPayment; }

        var dineType = session.SessionType switch
        {
            QrSessionType.DineIn => DineOrderType.DineIn, QrSessionType.TakeAway => DineOrderType.TakeAway,
            QrSessionType.Delivery => DineOrderType.Delivery, _ => DineOrderType.TakeAway,
        };
        var sysUser = await _uow.Repository<User>().QueryUnfiltered()
            .FirstOrDefaultAsync(u => u.TenantId == session.TenantId && !u.IsDeleted);

        if (sysUser != null)
        {
            var dineOrder = new DineOrder
            {
                TenantId = session.TenantId, OrderNumber = order.OrderNumber, OrderType = dineType,
                Status = DineOrderStatus.New, TableId = session.TableId, GuestCount = 1,
                CustomerName = order.CustomerName, CustomerPhone = order.CustomerPhone,
                DeliveryAddress = order.DeliveryAddress, SubTotal = order.SubTotal,
                TaxAmount = order.TaxAmount, TotalAmount = order.TotalAmount,
                Notes = $"[طلب QR] {order.Notes}", WaiterId = sysUser.Id,
            };
            foreach (var item in order.Items)
                dineOrder.Items.Add(new DineOrderItem
                {
                    ProductId = item.ProductId, Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice, TotalPrice = item.TotalPrice,
                    SpecialNotes = item.SpecialNotes, KitchenStatus = OrderItemKitchenStatus.Pending,
                });
            await _uow.Repository<DineOrder>().AddAsync(dineOrder);
            await _uow.SaveChangesAsync();

            order.DineOrderId = dineOrder.Id;
            dineOrder.Status = DineOrderStatus.InKitchen; dineOrder.KitchenSentAt = DateTime.UtcNow;
            foreach (var di in dineOrder.Items) { di.KitchenStatus = OrderItemKitchenStatus.Preparing; di.SentToKitchenAt = DateTime.UtcNow; }

            order.Status = pm == CustomerPaymentMethod.Cash ? CustomerOrderStatus.InKitchen : CustomerOrderStatus.PendingPayment;
            order.KitchenSentAt = DateTime.UtcNow;
            order.EstimatedMinutes = Math.Max(10, order.Items.Count * 5);

            if (session.TableId.HasValue)
            {
                var table = await _uow.Repository<RestaurantTable>().QueryUnfiltered()
                    .FirstOrDefaultAsync(t => t.Id == session.TableId.Value && t.TenantId == session.TenantId);
                if (table != null) table.Status = TableStatus.Occupied;
            }
        }
        await _uow.SaveChangesAsync();
        var reloaded = await _uow.Repository<CustomerOrder>().QueryUnfiltered()
            .Include(o => o.Items).ThenInclude(i => i.Product).FirstAsync(o => o.Id == order.Id);
        return Result<CustomerOrderDto>.Success(MapOrderToDto(reloaded));
    }

    public async Task<Result<CustomerOrderStatusDto>> GetOrderStatusAsync(string sessionToken, long orderId)
    {
        var session = await ValidateSession(sessionToken);
        if (session is null) return Result<CustomerOrderStatusDto>.Failure("الجلسة غير صالحة");
        var order = await _uow.Repository<CustomerOrder>().QueryUnfiltered()
            .FirstOrDefaultAsync(o => o.Id == orderId && o.SessionId == session.Id);
        if (order is null) return Result<CustomerOrderStatusDto>.Failure("الطلب غير موجود");

        if (order.DineOrderId.HasValue)
        {
            var dine = await _uow.Repository<DineOrder>().QueryUnfiltered().FirstOrDefaultAsync(d => d.Id == order.DineOrderId);
            if (dine != null)
            {
                order.Status = dine.Status switch
                {
                    DineOrderStatus.InKitchen => CustomerOrderStatus.InKitchen, DineOrderStatus.Preparing => CustomerOrderStatus.Preparing,
                    DineOrderStatus.Ready => CustomerOrderStatus.Ready, DineOrderStatus.Served => CustomerOrderStatus.Served,
                    DineOrderStatus.Billed => CustomerOrderStatus.Completed, DineOrderStatus.Cancelled => CustomerOrderStatus.Cancelled,
                    _ => order.Status,
                };
                if (dine.ReadyAt.HasValue) order.ReadyAt = dine.ReadyAt;
                await _uow.SaveChangesAsync();
            }
        }

        var elapsed = order.KitchenSentAt.HasValue ? (int)(DateTime.UtcNow - order.KitchenSentAt.Value).TotalSeconds : 0;
        var (label, color) = order.Status switch
        {
            CustomerOrderStatus.Cart => ("في السلة", "#6b7280"), CustomerOrderStatus.PendingPayment => ("بانتظار الدفع", "#f59e0b"),
            CustomerOrderStatus.Paid => ("تم الدفع", "#3b82f6"), CustomerOrderStatus.Confirmed => ("تم التأكيد", "#8b5cf6"),
            CustomerOrderStatus.InKitchen => ("في المطبخ", "#f97316"), CustomerOrderStatus.Preparing => ("قيد التحضير", "#eab308"),
            CustomerOrderStatus.Ready => ("جاهز!", "#22c55e"), CustomerOrderStatus.Served => ("تم التقديم", "#14b8a6"),
            CustomerOrderStatus.Completed => ("مكتمل", "#10b981"), CustomerOrderStatus.Cancelled => ("ملغي", "#ef4444"),
            _ => ("غير معروف", "#6b7280"),
        };

        return Result<CustomerOrderStatusDto>.Success(new CustomerOrderStatusDto(
            order.Id, order.OrderNumber, order.Status.ToString(),
            order.EstimatedMinutes, order.KitchenSentAt, order.ReadyAt, elapsed, label, color));
    }

    public async Task<Result<List<CustomerOrderDto>>> GetSessionOrdersAsync(string sessionToken)
    {
        var session = await ValidateSession(sessionToken);
        if (session is null) return Result<List<CustomerOrderDto>>.Failure("الجلسة غير صالحة");
        var orders = await _uow.Repository<CustomerOrder>().QueryUnfiltered()
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Where(o => o.SessionId == session.Id).OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Result<List<CustomerOrderDto>>.Success(orders.Select(MapOrderToDto).ToList());
    }

    private async Task<CustomerSession?> ValidateSession(string token) =>
        await _uow.Repository<CustomerSession>().QueryUnfiltered()
            .FirstOrDefaultAsync(s => s.SessionToken == token && s.IsActive && (s.ExpiresAt == null || s.ExpiresAt > DateTime.UtcNow));

    private async Task<CustomerOrder> GetOrCreateCart(CustomerSession session)
    {
        var order = await _uow.Repository<CustomerOrder>().QueryUnfiltered()
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Where(o => o.SessionId == session.Id && (o.Status == CustomerOrderStatus.Cart || o.Status == CustomerOrderStatus.Browsing))
            .FirstOrDefaultAsync();
        if (order is null)
        {
            order = new CustomerOrder
            {
                TenantId = session.TenantId, SessionId = session.Id,
                OrderNumber = $"QR-{DateTime.UtcNow:yyMMdd}-{new Random().Next(1000, 9999)}",
                Status = CustomerOrderStatus.Cart, OrderType = session.SessionType,
                TableId = session.TableId, CustomerName = session.CustomerName, CustomerPhone = session.CustomerPhone,
            };
            await _uow.Repository<CustomerOrder>().AddAsync(order);
            await _uow.SaveChangesAsync();
        }
        return order;
    }

    private void RecalculateOrder(CustomerOrder order, CustomerSession session)
    {
        order.SubTotal = order.Items.Sum(i => i.TotalPrice);
        order.TaxAmount = Math.Round(order.SubTotal * 0.15m, 2);
        var qrConfig = _uow.Repository<StoreQrConfig>().QueryUnfiltered().FirstOrDefault(q => q.Id == session.QrConfigId);
        order.ServiceCharge = qrConfig?.ServiceChargePercent > 0
            ? Math.Round(order.SubTotal * (qrConfig.ServiceChargePercent.Value / 100), 2) : 0;
        order.TotalAmount = order.SubTotal + order.TaxAmount + order.ServiceCharge;
    }

    private static CustomerOrderDto MapOrderToDto(CustomerOrder o) => new(
        o.Id, o.OrderNumber, o.Status.ToString(), o.OrderType.ToString(),
        o.TableId, o.CustomerName, o.CustomerPhone,
        o.SubTotal, o.TaxAmount, o.ServiceCharge, o.TotalAmount,
        o.PaymentMethod?.ToString(), o.PaymentReference, o.PaidAt,
        o.Notes, o.EstimatedMinutes,
        o.CreatedAt, o.ConfirmedAt, o.KitchenSentAt, o.ReadyAt, o.CompletedAt,
        o.Items.Select(i => new CustomerOrderItemDto(
            i.Id, i.ProductId, i.Product?.Name ?? "", i.Product?.ImageUrl,
            i.Quantity, i.UnitPrice, i.TotalPrice, i.SpecialNotes)).ToList());
}

// ============================================================
// Payment Terminal Service
// ============================================================

