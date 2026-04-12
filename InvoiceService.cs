namespace MsCashier.Application.Services;

using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;

public class InvoiceService : IInvoiceService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public InvoiceService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<InvoiceDto>> CreateSaleAsync(CreateInvoiceRequest request)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            // 1. Validate items
            if (request.Items == null || !request.Items.Any())
                return Result<InvoiceDto>.Failure("يجب إضافة صنف واحد على الأقل");

            // 2. Generate invoice number
            var count = await _uow.Repository<Invoice>().CountAsync(
                i => i.TenantId == _tenant.TenantId && i.InvoiceType == InvoiceType.Sale);
            var invoiceNumber = $"INV-{(count + 1):D6}";

            // 3. Calculate totals
            decimal subTotal = 0;
            decimal taxTotal = 0;
            var invoiceItems = new List<InvoiceItem>();

            foreach (var item in request.Items)
            {
                var product = await _uow.Repository<Product>().GetByIdAsync(item.ProductId);
                if (product == null || product.TenantId != _tenant.TenantId)
                    return Result<InvoiceDto>.Failure($"صنف غير موجود: {item.ProductId}");

                // Check stock
                if (product.TrackInventory && !product.AllowNegativeStock)
                {
                    var inventory = (await _uow.Repository<Inventory>().FindAsync(
                        inv => inv.ProductId == item.ProductId
                            && inv.WarehouseId == request.WarehouseId
                            && inv.TenantId == _tenant.TenantId)).FirstOrDefault();

                    if (inventory == null || inventory.AvailableQty < item.Quantity)
                        return Result<InvoiceDto>.Failure($"الكمية غير كافية للصنف: {product.Name}");
                }

                var lineTotal = (item.Quantity * item.UnitPrice) - item.DiscountAmount;
                var lineTax = lineTotal * (product.TaxRate ?? 0) / 100;

                invoiceItems.Add(new InvoiceItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    CostPrice = product.CostPrice,
                    DiscountAmount = item.DiscountAmount,
                    TaxAmount = lineTax,
                    TotalPrice = lineTotal + lineTax
                });

                subTotal += lineTotal;
                taxTotal += lineTax;
            }

            var totalAmount = subTotal - request.DiscountAmount + taxTotal;
            var dueAmount = totalAmount - request.PaidAmount;
            var paymentStatus = dueAmount <= 0 ? PaymentStatus.Paid
                : request.PaidAmount > 0 ? PaymentStatus.Partial
                : PaymentStatus.Unpaid;

            // 4. Create invoice
            var invoice = new Invoice
            {
                TenantId = _tenant.TenantId,
                InvoiceNumber = invoiceNumber,
                InvoiceType = InvoiceType.Sale,
                InvoiceDate = DateTime.UtcNow,
                ContactId = request.ContactId,
                WarehouseId = request.WarehouseId,
                PriceType = request.PriceType,
                SubTotal = subTotal,
                DiscountAmount = request.DiscountAmount,
                TaxAmount = taxTotal,
                TotalAmount = totalAmount,
                PaidAmount = request.PaidAmount,
                DueAmount = Math.Max(0, dueAmount),
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = paymentStatus,
                Notes = request.Notes,
                CreatedBy = _tenant.UserId,
                Items = invoiceItems
            };

            await _uow.Repository<Invoice>().AddAsync(invoice);
            await _uow.SaveChangesAsync();

            // 5. Update inventory
            foreach (var item in request.Items)
            {
                var inventoryList = await _uow.Repository<Inventory>().FindAsync(
                    inv => inv.ProductId == item.ProductId
                        && inv.WarehouseId == request.WarehouseId
                        && inv.TenantId == _tenant.TenantId);
                var inventory = inventoryList.FirstOrDefault();

                if (inventory != null)
                {
                    var prevQty = inventory.Quantity;
                    inventory.Quantity -= item.Quantity;
                    inventory.LastUpdated = DateTime.UtcNow;
                    await _uow.Repository<Inventory>().UpdateAsync(inventory);

                    // Record transaction
                    await _uow.Repository<InventoryTransaction>().AddAsync(new InventoryTransaction
                    {
                        TenantId = _tenant.TenantId,
                        ProductId = item.ProductId,
                        WarehouseId = request.WarehouseId,
                        TransactionType = InventoryTransactionType.StockOut,
                        Quantity = item.Quantity,
                        PreviousQty = prevQty,
                        NewQty = inventory.Quantity,
                        ReferenceType = "Sale",
                        ReferenceId = invoice.Id.ToString(),
                        CreatedBy = _tenant.UserId
                    });
                }
            }

            // 6. Update customer balance if credit
            if (request.ContactId.HasValue && dueAmount > 0)
            {
                var contact = await _uow.Repository<Contact>().GetByIdAsync(request.ContactId.Value);
                if (contact != null)
                {
                    contact.Balance += dueAmount;
                    contact.UpdatedAt = DateTime.UtcNow;
                    await _uow.Repository<Contact>().UpdateAsync(contact);
                }
            }

            // 7. Record finance transaction
            if (request.PaidAmount > 0)
            {
                var accountType = request.PaymentMethod switch
                {
                    PaymentMethod.Cash => AccountType.Cash,
                    PaymentMethod.Visa => AccountType.Bank,
                    PaymentMethod.Instapay => AccountType.Digital,
                    _ => AccountType.Cash
                };

                var accounts = await _uow.Repository<FinanceAccount>().FindAsync(
                    a => a.TenantId == _tenant.TenantId && a.AccountType == accountType);
                var account = accounts.FirstOrDefault();

                if (account != null)
                {
                    var balanceBefore = account.Balance;
                    account.Balance += request.PaidAmount;
                    await _uow.Repository<FinanceAccount>().UpdateAsync(account);

                    await _uow.Repository<FinanceTransaction>().AddAsync(new FinanceTransaction
                    {
                        TenantId = _tenant.TenantId,
                        AccountId = account.Id,
                        TransactionType = Domain.Enums.TransactionType.Income,
                        Category = "مبيعات",
                        Amount = request.PaidAmount,
                        BalanceBefore = balanceBefore,
                        BalanceAfter = account.Balance,
                        Description = $"فاتورة بيع {invoiceNumber}",
                        ReferenceType = "Sale",
                        ReferenceId = invoice.Id.ToString(),
                        CreatedBy = _tenant.UserId
                    });
                }
            }

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            // 8. Build response
            return Result<InvoiceDto>.Success(MapToDto(invoice), "تم إنشاء الفاتورة بنجاح");
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<InvoiceDto>.Failure($"خطأ في إنشاء الفاتورة: {ex.Message}");
        }
    }

    public async Task<Result<InvoiceDto>> CreateSaleReturnAsync(long originalInvoiceId, List<InvoiceItemRequest> returnItems)
    {
        var original = await _uow.Repository<Invoice>().GetByIdAsync(originalInvoiceId);
        if (original == null || original.TenantId != _tenant.TenantId)
            return Result<InvoiceDto>.Failure("الفاتورة الأصلية غير موجودة");

        var request = new CreateInvoiceRequest(
            original.ContactId, original.WarehouseId, original.PriceType,
            original.PaymentMethod, 0,
            returnItems.Sum(i => i.Quantity * i.UnitPrice),
            $"مرتجع فاتورة {original.InvoiceNumber}", returnItems);

        // Similar logic but with StockIn instead of StockOut
        // and deducting from finance instead of adding
        return Result<InvoiceDto>.Failure("سيتم التنفيذ");
    }

    public async Task<Result<InvoiceDto>> GetByIdAsync(long id)
    {
        var invoice = await _uow.Repository<Invoice>().GetByIdAsync(id);
        if (invoice == null || invoice.TenantId != _tenant.TenantId)
            return Result<InvoiceDto>.Failure("الفاتورة غير موجودة");

        return Result<InvoiceDto>.Success(MapToDto(invoice));
    }

    public async Task<Result<PagedResult<InvoiceDto>>> SearchAsync(InvoiceSearchRequest request)
    {
        var result = await _uow.Repository<Invoice>().GetPagedAsync(
            i => i.TenantId == _tenant.TenantId
                && !i.IsDeleted
                && (!request.DateFrom.HasValue || i.InvoiceDate >= request.DateFrom)
                && (!request.DateTo.HasValue || i.InvoiceDate <= request.DateTo)
                && (!request.ContactId.HasValue || i.ContactId == request.ContactId)
                && (!request.PaymentMethod.HasValue || i.PaymentMethod == request.PaymentMethod)
                && (!request.PaymentStatus.HasValue || i.PaymentStatus == request.PaymentStatus)
                && (!request.InvoiceType.HasValue || i.InvoiceType == request.InvoiceType),
            request.Page, request.PageSize,
            i => i.InvoiceDate, true);

        return Result<PagedResult<InvoiceDto>>.Success(new PagedResult<InvoiceDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        });
    }

    public async Task<Result<InvoiceDto>> CreatePurchaseAsync(CreateInvoiceRequest request)
    {
        // Similar to CreateSaleAsync but with InvoiceType.Purchase and StockIn
        return Result<InvoiceDto>.Failure("سيتم التنفيذ");
    }

    private InvoiceDto MapToDto(Invoice invoice) => new InvoiceDto(
        invoice.Id, invoice.InvoiceNumber, invoice.InvoiceType,
        invoice.InvoiceDate, invoice.ContactId, invoice.Contact?.Name,
        invoice.WarehouseId, invoice.Warehouse?.Name ?? "",
        invoice.PriceType, invoice.SubTotal, invoice.DiscountAmount,
        invoice.TaxAmount, invoice.TotalAmount, invoice.PaidAmount,
        invoice.DueAmount, invoice.PaymentMethod, invoice.PaymentStatus,
        invoice.Notes, invoice.Creator?.FullName ?? "",
        invoice.Items.Select(i => new InvoiceItemDto(
            i.Id, i.ProductId, i.Product?.Name ?? "", i.Product?.Barcode,
            i.Quantity, i.Product?.Unit?.Name ?? "قطعة",
            i.UnitPrice, i.CostPrice, i.DiscountAmount, i.TotalPrice
        )).ToList());
}
