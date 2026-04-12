using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ============================================================
// Dine Order Service
// ============================================================

public class DineOrderService : IDineOrderService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _ts;
    private readonly IInvoiceService _invoiceService;

    public DineOrderService(IUnitOfWork uow, ICurrentTenantService ts, IInvoiceService invoiceService)
    {
        _uow = uow;
        _ts = ts;
        _invoiceService = invoiceService;
    }

    public async Task<Result<DineOrderDto>> CreateOrderAsync(CreateDineOrderRequest dto)
    {
        var orderType = Enum.TryParse<DineOrderType>(dto.OrderType, out var ot) ? ot : DineOrderType.DineIn;

        // If dine-in, mark table as occupied
        if (orderType == DineOrderType.DineIn && dto.TableId.HasValue)
        {
            var table = await _uow.Repository<RestaurantTable>().GetByIdAsync(dto.TableId.Value);
            if (table != null) table.Status = TableStatus.Occupied;
        }

        var orderNumber = $"ORD-{DateTime.UtcNow:yyMMdd}-{DateTime.UtcNow:HHmmss}";

        var order = new DineOrder
        {
            OrderNumber = orderNumber,
            OrderType = orderType,
            Status = DineOrderStatus.New,
            TableId = dto.TableId,
            GuestCount = dto.GuestCount,
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            DeliveryAddress = dto.DeliveryAddress,
            Notes = dto.Notes,
            WaiterId = _ts.UserId,
        };

        // Build items
        decimal subTotal = 0;
        foreach (var item in dto.Items)
        {
            var product = await _uow.Repository<Product>().GetByIdAsync(item.ProductId);
            if (product == null) continue;

            var price = product.RetailPrice;
            var total = price * item.Quantity;
            subTotal += total;

            order.Items.Add(new DineOrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = price,
                TotalPrice = total,
                SpecialNotes = item.SpecialNotes,
                KitchenStatus = OrderItemKitchenStatus.Pending,
            });
        }

        order.SubTotal = subTotal;
        order.TotalAmount = subTotal; // Tax/discount applied at billing

        await _uow.Repository<DineOrder>().AddAsync(order);
        await _uow.SaveChangesAsync();

        return Result<DineOrderDto>.Success(await MapOrderAsync(order));
    }

    public async Task<Result<DineOrderDto>> GetByIdAsync(long id)
    {
        var order = await GetOrderWithIncludes(id);
        if (order == null) return Result<DineOrderDto>.Failure("الطلب غير موجود");
        return Result<DineOrderDto>.Success(await MapOrderAsync(order));
    }

    public async Task<Result<List<DineOrderDto>>> GetActiveOrdersAsync()
    {
        var orders = await _uow.Repository<DineOrder>().Query()
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Include(o => o.Table).Include(o => o.Waiter)
            .Where(o => o.Status != DineOrderStatus.Billed && o.Status != DineOrderStatus.Cancelled)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var dtos = new List<DineOrderDto>();
        foreach (var o in orders) dtos.Add(await MapOrderAsync(o));
        return Result<List<DineOrderDto>>.Success(dtos);
    }

    public async Task<Result<List<DineOrderDto>>> GetOrdersByTableAsync(int tableId)
    {
        var orders = await _uow.Repository<DineOrder>().Query()
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Include(o => o.Table).Include(o => o.Waiter)
            .Where(o => o.TableId == tableId && o.Status != DineOrderStatus.Billed && o.Status != DineOrderStatus.Cancelled)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var dtos = new List<DineOrderDto>();
        foreach (var o in orders) dtos.Add(await MapOrderAsync(o));
        return Result<List<DineOrderDto>>.Success(dtos);
    }

    public async Task<Result<DineOrderDto>> AddItemsAsync(long orderId, AddItemsToOrderRequest dto)
    {
        var order = await GetOrderWithIncludes(orderId);
        if (order == null) return Result<DineOrderDto>.Failure("الطلب غير موجود");
        if (order.Status == DineOrderStatus.Billed || order.Status == DineOrderStatus.Cancelled)
            return Result<DineOrderDto>.Failure("لا يمكن إضافة أصناف لهذا الطلب");

        foreach (var item in dto.Items)
        {
            var product = await _uow.Repository<Product>().GetByIdAsync(item.ProductId);
            if (product == null) continue;

            var price = product.RetailPrice;
            order.Items.Add(new DineOrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = price,
                TotalPrice = price * item.Quantity,
                SpecialNotes = item.SpecialNotes,
                KitchenStatus = OrderItemKitchenStatus.Pending,
            });
        }

        RecalcTotals(order);
        await _uow.SaveChangesAsync();
        return Result<DineOrderDto>.Success(await MapOrderAsync(order));
    }

    public async Task<Result<DineOrderDto>> SendToKitchenAsync(long orderId)
    {
        var order = await GetOrderWithIncludes(orderId);
        if (order == null) return Result<DineOrderDto>.Failure("الطلب غير موجود");

        order.Status = DineOrderStatus.InKitchen;
        order.KitchenSentAt = DateTime.UtcNow;

        foreach (var item in order.Items.Where(i => i.KitchenStatus == OrderItemKitchenStatus.Pending))
        {
            item.KitchenStatus = OrderItemKitchenStatus.Preparing;
            item.SentToKitchenAt = DateTime.UtcNow;
        }

        await _uow.SaveChangesAsync();
        return Result<DineOrderDto>.Success(await MapOrderAsync(order));
    }

    public async Task<Result<DineOrderDto>> MarkServedAsync(long orderId)
    {
        var order = await GetOrderWithIncludes(orderId);
        if (order == null) return Result<DineOrderDto>.Failure("الطلب غير موجود");

        order.Status = DineOrderStatus.Served;
        order.ServedAt = DateTime.UtcNow;
        foreach (var item in order.Items) item.KitchenStatus = OrderItemKitchenStatus.Served;

        await _uow.SaveChangesAsync();
        return Result<DineOrderDto>.Success(await MapOrderAsync(order));
    }

    public async Task<Result<DineOrderDto>> CancelOrderAsync(long orderId)
    {
        var order = await GetOrderWithIncludes(orderId);
        if (order == null) return Result<DineOrderDto>.Failure("الطلب غير موجود");

        order.Status = DineOrderStatus.Cancelled;
        foreach (var item in order.Items) item.KitchenStatus = OrderItemKitchenStatus.Cancelled;

        // Free the table
        if (order.TableId.HasValue)
        {
            var table = await _uow.Repository<RestaurantTable>().GetByIdAsync(order.TableId.Value);
            if (table != null) table.Status = TableStatus.Available;
        }

        await _uow.SaveChangesAsync();
        return Result<DineOrderDto>.Success(await MapOrderAsync(order));
    }

    // ── Kitchen ──

    public async Task<Result<List<KitchenOrderDto>>> GetKitchenBoardAsync()
    {
        var orders = await _uow.Repository<DineOrder>().Query()
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Include(o => o.Table).Include(o => o.Waiter)
            .Where(o => o.Status == DineOrderStatus.InKitchen || o.Status == DineOrderStatus.Preparing)
            .OrderBy(o => o.KitchenSentAt)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var dtos = orders.Select(o => new KitchenOrderDto(
            o.Id, o.OrderNumber, o.OrderType.ToString(),
            o.Table?.TableNumber, o.GuestCount, o.Waiter?.FullName,
            o.KitchenSentAt ?? o.CreatedAt,
            (int)(now - (o.KitchenSentAt ?? o.CreatedAt)).TotalMinutes,
            o.Items.Where(i => i.KitchenStatus != OrderItemKitchenStatus.Cancelled).Select(i =>
                new KitchenItemDto(i.Id, i.Product?.Name ?? "", i.Quantity, i.SpecialNotes, i.KitchenStatus.ToString())
            ).ToList()
        )).ToList();

        return Result<List<KitchenOrderDto>>.Success(dtos);
    }

    public async Task<Result<bool>> UpdateItemKitchenStatusAsync(long itemId, UpdateOrderItemStatusRequest dto)
    {
        var item = await _uow.Repository<DineOrderItem>().GetByIdAsync(itemId);
        if (item == null) return Result<bool>.Failure("الصنف غير موجود");

        if (Enum.TryParse<OrderItemKitchenStatus>(dto.KitchenStatus, out var s))
        {
            item.KitchenStatus = s;
            if (s == OrderItemKitchenStatus.Ready) item.ReadyAt = DateTime.UtcNow;
        }

        await _uow.SaveChangesAsync();

        // Check if all items ready => mark order ready
        var order = await GetOrderWithIncludes(item.OrderId);
        if (order != null && order.Items.All(i => i.KitchenStatus == OrderItemKitchenStatus.Ready || i.KitchenStatus == OrderItemKitchenStatus.Cancelled))
        {
            order.Status = DineOrderStatus.Ready;
            order.ReadyAt = DateTime.UtcNow;
            await _uow.SaveChangesAsync();
        }

        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> MarkAllItemsReadyAsync(long orderId)
    {
        var order = await GetOrderWithIncludes(orderId);
        if (order == null) return Result<bool>.Failure("الطلب غير موجود");

        foreach (var item in order.Items.Where(i => i.KitchenStatus != OrderItemKitchenStatus.Cancelled))
        {
            item.KitchenStatus = OrderItemKitchenStatus.Ready;
            item.ReadyAt = DateTime.UtcNow;
        }

        order.Status = DineOrderStatus.Ready;
        order.ReadyAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    // ── Billing ──

    public async Task<Result<DineOrderDto>> BillOrderAsync(long orderId, BillOrderRequest dto)
    {
        var order = await GetOrderWithIncludes(orderId);
        if (order == null) return Result<DineOrderDto>.Failure("الطلب غير موجود");
        if (order.Status == DineOrderStatus.Billed)
            return Result<DineOrderDto>.Failure("تم تحويل الطلب لفاتورة بالفعل");

        // Apply discount
        if (dto.DiscountAmount.HasValue && dto.DiscountAmount > 0)
        {
            order.DiscountAmount = dto.DiscountAmount.Value;
            RecalcTotals(order);
        }

        // Create the POS invoice via InvoiceService
        var invoiceItems = order.Items
            .Where(i => i.KitchenStatus != OrderItemKitchenStatus.Cancelled)
            .Select(i => new InvoiceItemRequest(i.ProductId, i.Quantity, i.UnitPrice, 0))
            .ToList();

        var invoiceReq = new CreateInvoiceRequest(
            ContactId: null,
            WarehouseId: dto.WarehouseId,
            PriceType: PriceType.Retail,
            PaymentMethod: (PaymentMethod)dto.PaymentMethod,
            DiscountAmount: order.DiscountAmount,
            PaidAmount: dto.PaidAmount ?? order.TotalAmount,
            Notes: $"طلب رقم {order.OrderNumber}",
            Items: invoiceItems
        );

        var invoiceResult = await _invoiceService.CreateSaleAsync(invoiceReq);
        if (!invoiceResult.IsSuccess)
            return Result<DineOrderDto>.Failure(invoiceResult.Errors.FirstOrDefault() ?? "فشل إنشاء الفاتورة");

        order.InvoiceId = invoiceResult.Data!.Id;
        order.Status = DineOrderStatus.Billed;
        order.BilledAt = DateTime.UtcNow;

        // Free the table
        if (order.TableId.HasValue)
        {
            var table = await _uow.Repository<RestaurantTable>().GetByIdAsync(order.TableId.Value);
            if (table != null) table.Status = TableStatus.Available;
        }

        await _uow.SaveChangesAsync();
        return Result<DineOrderDto>.Success(await MapOrderAsync(order));
    }

    // ── Helpers ──

    private async Task<DineOrder?> GetOrderWithIncludes(long id)
    {
        return await _uow.Repository<DineOrder>().Query()
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .Include(o => o.Table).Include(o => o.Waiter)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    private static void RecalcTotals(DineOrder order)
    {
        order.SubTotal = order.Items
            .Where(i => i.KitchenStatus != OrderItemKitchenStatus.Cancelled)
            .Sum(i => i.TotalPrice);
        order.TotalAmount = order.SubTotal - order.DiscountAmount + order.TaxAmount;
    }

    private Task<DineOrderDto> MapOrderAsync(DineOrder o)
    {
        var dto = new DineOrderDto(
            o.Id, o.OrderNumber, o.OrderType.ToString(), o.Status.ToString(),
            o.TableId, o.Table?.TableNumber, o.GuestCount,
            o.CustomerName, o.CustomerPhone, o.DeliveryAddress,
            o.SubTotal, o.DiscountAmount, o.TaxAmount, o.TotalAmount,
            o.Notes, o.WaiterId, o.Waiter?.FullName,
            o.InvoiceId, o.KitchenSentAt, o.ReadyAt, o.ServedAt, o.BilledAt, o.CreatedAt,
            o.Items.Select(i => new DineOrderItemDto(
                i.Id, i.ProductId, i.Product?.Name ?? "", i.Product?.Barcode,
                i.Quantity, i.UnitPrice, i.TotalPrice,
                i.KitchenStatus.ToString(), i.SpecialNotes,
                i.SentToKitchenAt, i.ReadyAt
            )).ToList());
        return Task.FromResult(dto);
    }

    // ── Kitchen extras ──

    public async Task<Result<KitchenStatsDto>> GetKitchenStatsAsync()
    {
        var today = DateTime.UtcNow.Date;

        var activeOrders = await _uow.Repository<DineOrder>().Query()
            .Include(o => o.Items)
            .Where(o => o.Status == DineOrderStatus.InKitchen || o.Status == DineOrderStatus.Preparing)
            .ToListAsync();

        var completedToday = await _uow.Repository<DineOrder>().Query()
            .Where(o => o.ReadyAt != null && o.ReadyAt >= today && (o.Status == DineOrderStatus.Ready || o.Status == DineOrderStatus.Served || o.Status == DineOrderStatus.Billed))
            .ToListAsync();

        var cancelledToday = await _uow.Repository<DineOrder>().Query()
            .CountAsync(o => o.Status == DineOrderStatus.Cancelled && o.CreatedAt >= today);

        var now = DateTime.UtcNow;
        var preparingItems = activeOrders.SelectMany(o => o.Items).Count(i => i.KitchenStatus == OrderItemKitchenStatus.Preparing);
        var readyItems = activeOrders.SelectMany(o => o.Items).Count(i => i.KitchenStatus == OrderItemKitchenStatus.Ready);
        var urgentOrders = activeOrders.Count(o => (now - (o.KitchenSentAt ?? o.CreatedAt)).TotalMinutes >= 20);

        var avgPrep = completedToday.Count > 0
            ? completedToday.Where(o => o.KitchenSentAt != null && o.ReadyAt != null)
                .Select(o => (o.ReadyAt!.Value - o.KitchenSentAt!.Value).TotalMinutes)
                .DefaultIfEmpty(0).Average()
            : 0;

        return Result<KitchenStatsDto>.Success(new KitchenStatsDto(
            activeOrders.Count, preparingItems, readyItems, urgentOrders,
            Math.Round(avgPrep, 1), completedToday.Count, cancelledToday));
    }

    public async Task<Result<List<CompletedKitchenOrderDto>>> GetCompletedOrdersAsync(int limit)
    {
        var orders = await _uow.Repository<DineOrder>().Query()
            .Include(o => o.Items).Include(o => o.Table).Include(o => o.Waiter)
            .Where(o => o.Status == DineOrderStatus.Ready || o.Status == DineOrderStatus.Served || o.Status == DineOrderStatus.Billed)
            .Where(o => o.ReadyAt != null)
            .OrderByDescending(o => o.ReadyAt)
            .Take(limit)
            .ToListAsync();

        var dtos = orders.Select(o =>
        {
            var prep = o.KitchenSentAt != null && o.ReadyAt != null
                ? (int)(o.ReadyAt.Value - o.KitchenSentAt.Value).TotalMinutes : 0;
            return new CompletedKitchenOrderDto(
                o.Id, o.OrderNumber, o.OrderType.ToString(),
                o.Table?.TableNumber, o.Waiter?.FullName,
                o.ReadyAt!.Value, prep, o.Items.Count);
        }).ToList();

        return Result<List<CompletedKitchenOrderDto>>.Success(dtos);
    }

    public async Task<Result<bool>> RecallOrderAsync(long orderId)
    {
        var order = await GetOrderWithIncludes(orderId);
        if (order == null) return Result<bool>.Failure("الطلب غير موجود");

        // Recall back to kitchen
        order.Status = DineOrderStatus.InKitchen;
        order.ReadyAt = null;
        foreach (var item in order.Items.Where(i => i.KitchenStatus == OrderItemKitchenStatus.Ready))
        {
            item.KitchenStatus = OrderItemKitchenStatus.Preparing;
            item.ReadyAt = null;
        }

        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}

// ============================================================
// Floor Section Service
// ============================================================

