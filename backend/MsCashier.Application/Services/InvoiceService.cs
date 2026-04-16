using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Application.Services.Accounting.Posting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 3. InvoiceService
// ════════════════════════════════════════════════════════════════

public class InvoiceService : IInvoiceService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly IAuditService _audit;
    private readonly INotificationService _notif;
    private readonly ISalePostingService _salePostingService;
    private readonly IPostingFailureLogger _postingFailureLogger;

    public InvoiceService(IUnitOfWork uow, ICurrentTenantService tenant, IAuditService audit, INotificationService notif, ISalePostingService salePostingService, IPostingFailureLogger postingFailureLogger)
    {
        _uow = uow;
        _tenant = tenant;
        _audit = audit;
        _notif = notif;
        _salePostingService = salePostingService;
        _postingFailureLogger = postingFailureLogger;
    }

    public async Task<Result<InvoiceDto>> CreateSaleAsync(CreateInvoiceRequest request)
    {
        Invoice invoice;
        var effectiveWarehouseId = request.WarehouseId;

        try
        {
            await _uow.BeginTransactionAsync();

            // 0. Resolve SalesRep and effective warehouse FIRST (before validation)
            SalesRep? salesRep = null;

            if (request.SalesRepId.HasValue)
            {
                salesRep = await _uow.Repository<SalesRep>().GetByIdAsync(request.SalesRepId.Value);
                if (salesRep is null || !salesRep.IsActive)
                {
                    await _uow.RollbackTransactionAsync();
                    return Result<InvoiceDto>.Failure("المندوب غير موجود أو معطّل");
                }
                if (salesRep.AssignedWarehouseId.HasValue)
                {
                    effectiveWarehouseId = salesRep.AssignedWarehouseId.Value;
                }
            }

            // 1. Validate items exist and have stock (using effectiveWarehouseId)
            foreach (var item in request.Items)
            {
                var product = await _uow.Repository<Product>().Query()
                    .FirstOrDefaultAsync(p =>
                        p.Id == item.ProductId &&
                        p.TenantId == _tenant.TenantId &&
                        !p.IsDeleted);

                if (product is null)
                {
                    await _uow.RollbackTransactionAsync();
                    return Result<InvoiceDto>.Failure($"المنتج رقم {item.ProductId} غير موجود");
                }

                if (product.TrackInventory && !product.AllowNegativeStock)
                {
                    // Check stock in the target warehouse first
                    var available = await _uow.Repository<Inventory>().Query()
                        .Where(i =>
                            i.ProductId == item.ProductId &&
                            i.WarehouseId == effectiveWarehouseId)
                        .SumAsync(i => i.Quantity - i.ReservedQty);

                    if (available < item.Quantity)
                    {
                        // Check ALL warehouses to give a helpful error
                        var totalAllWarehouses = await _uow.Repository<Inventory>().Query()
                            .Where(i => i.ProductId == item.ProductId)
                            .SumAsync(i => i.Quantity - i.ReservedQty);

                        if (totalAllWarehouses >= item.Quantity)
                        {
                            // Stock exists but in another warehouse — find which one
                            var otherStock = await _uow.Repository<Inventory>().Query()
                                .Include(i => i.Warehouse)
                                .Where(i => i.ProductId == item.ProductId && i.WarehouseId != effectiveWarehouseId && (i.Quantity - i.ReservedQty) > 0)
                                .Select(i => new { i.Warehouse!.Name, Qty = i.Quantity - i.ReservedQty })
                                .FirstOrDefaultAsync();

                            await _uow.RollbackTransactionAsync();
                            return Result<InvoiceDto>.Failure(
                                $"الكمية غير كافية في المستودع الحالي للمنتج: {product.Name} (المتوفر: {available}). " +
                                $"يتوفر {totalAllWarehouses} في مستودعات أخرى" +
                                (otherStock != null ? $" ({otherStock.Name}: {otherStock.Qty})" : ""));
                        }

                        await _uow.RollbackTransactionAsync();
                        return Result<InvoiceDto>.Failure($"الكمية غير كافية للمنتج: {product.Name} (المتوفر: {available})");
                    }
                }
            }

            // 2. Generate invoice number
            var invoiceCount = await _uow.Repository<Invoice>().CountAsync(i =>
                i.TenantId == _tenant.TenantId &&
                i.InvoiceType == InvoiceType.Sale);
            var invoiceNumber = $"INV-{(invoiceCount + 1):D6}";

            // 2.5. Load tenant tax config for default VAT fallback
            var taxConfig = await _uow.Repository<TenantTaxConfig>().Query()
                .AsNoTracking()
                .FirstOrDefaultAsync();
            var defaultVatRate = taxConfig?.IsEnabled == true ? taxConfig.DefaultVatRate : 0m;

            // 3. Calculate per-item totals with tax
            var invoiceItems = new List<InvoiceItem>();
            decimal subTotal = 0;
            decimal totalTax = 0;

            foreach (var item in request.Items)
            {
                var product = await _uow.Repository<Product>().Query()
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.TenantId == _tenant.TenantId);

                // === Bundle handling ===
                if (product!.IsBundle)
                {
                    var bundleItems = await _uow.Repository<BundleItem>().Query()
                        .Include(bi => bi.Component)
                        .Where(bi => bi.ProductId == product.Id)
                        .OrderBy(bi => bi.SortOrder)
                        .ToListAsync();

                    var bundlePrice = CalcBundlePrice(product, bundleItems, request.PriceType);
                    var bundleCost = bundleItems.Sum(bi => (bi.Component?.CostPrice ?? 0) * bi.Quantity);
                    var lineTotal = bundlePrice * item.Quantity;
                    var lineDiscount = item.DiscountAmount;
                    var taxableAmount = lineTotal - lineDiscount;
                    var lineTax = defaultVatRate > 0 ? Math.Round(taxableAmount * defaultVatRate / 100, 2) : 0m;

                    invoiceItems.Add(new InvoiceItem
                    {
                        ProductId = product.Id,
                        Quantity = item.Quantity,
                        UnitPrice = bundlePrice,
                        CostPrice = bundleCost,
                        DiscountAmount = lineDiscount,
                        TaxAmount = lineTax,
                        TotalPrice = taxableAmount + lineTax,
                        BundleParentId = null,
                    });

                    // Child items for each component (for display and inventory tracking)
                    foreach (var bi in bundleItems)
                    {
                        invoiceItems.Add(new InvoiceItem
                        {
                            ProductId = bi.ComponentId,
                            Quantity = bi.Quantity * item.Quantity,
                            UnitPrice = 0,
                            CostPrice = bi.Component?.CostPrice ?? 0,
                            DiscountAmount = 0,
                            TaxAmount = 0,
                            TotalPrice = 0,
                            BundleParentId = -1, // placeholder — fixed after save
                        });
                    }

                    subTotal += lineTotal;
                    totalTax += lineTax;
                    continue; // skip normal item processing
                }

                var lineTotal2 = item.Quantity * item.UnitPrice;
                var lineDiscount2 = item.DiscountAmount;
                var taxableAmount2 = lineTotal2 - lineDiscount2;
                // Use product-specific rate, or fall back to tenant default
                var effectiveTaxRate = product.TaxRate ?? (defaultVatRate > 0 ? defaultVatRate : (decimal?)null);
                var lineTax2 = effectiveTaxRate.HasValue
                    ? taxableAmount2 * (effectiveTaxRate.Value / 100m)
                    : 0;

                var invoiceItem = new InvoiceItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    CostPrice = product.CostPrice,
                    DiscountAmount = lineDiscount2,
                    TaxAmount = Math.Round(lineTax2, 2),
                    TotalPrice = Math.Round(taxableAmount2 + lineTax2, 2)
                };

                invoiceItems.Add(invoiceItem);
                subTotal += lineTotal2;
                totalTax += Math.Round(lineTax2, 2);
            }

            var totalAmount = subTotal - request.DiscountAmount + totalTax;

            var paymentStatus = request.PaidAmount >= totalAmount
                ? PaymentStatus.Paid
                : request.PaidAmount > 0
                    ? PaymentStatus.Partial
                    : PaymentStatus.Unpaid;

            // 3.7. Resolve currency + exchange rate
            string? currencyCode = request.CurrencyCode;
            decimal exchangeRate = 1m;
            decimal? totalInBase = null;

            if (!string.IsNullOrWhiteSpace(currencyCode))
            {
                var currency = await _uow.Repository<TenantCurrency>().Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.CurrencyCode == currencyCode && !c.IsDeleted);
                if (currency is not null)
                {
                    exchangeRate = currency.ExchangeRate;
                    if (!currency.IsDefault)
                    {
                        totalInBase = Math.Round(totalAmount * exchangeRate, 2);
                    }
                }
            }

            // 4. Create Invoice entity
            invoice = new Invoice
            {
                TenantId = _tenant.TenantId,
                InvoiceNumber = invoiceNumber,
                InvoiceType = InvoiceType.Sale,
                InvoiceDate = DateTime.UtcNow,
                ContactId = request.ContactId,
                WarehouseId = effectiveWarehouseId,
                PriceType = request.PriceType,
                SubTotal = Math.Round(subTotal, 2),
                DiscountAmount = request.DiscountAmount,
                TaxAmount = Math.Round(totalTax, 2),
                TotalAmount = Math.Round(totalAmount, 2),
                PaidAmount = request.PaidAmount,
                DueAmount = Math.Round(totalAmount - request.PaidAmount, 2),
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = paymentStatus,
                Notes = request.Notes,
                CreatedBy = _tenant.UserId,
                SalesRepId = request.SalesRepId,
                CurrencyCode = currencyCode,
                ExchangeRate = exchangeRate != 1m ? exchangeRate : null,
                TotalInBaseCurrency = totalInBase,
                FinanceAccountId = request.FinanceAccountId,
            };

            await _uow.Repository<Invoice>().AddAsync(invoice);
            await _uow.SaveChangesAsync();

            // Assign InvoiceId to items and save
            foreach (var item in invoiceItems)
            {
                item.InvoiceId = invoice.Id;
                await _uow.Repository<InvoiceItem>().AddAsync(item);
            }
            await _uow.SaveChangesAsync();

            // Fix BundleParentId placeholder values
            var savedItems = await _uow.Repository<InvoiceItem>().Query()
                .Where(ii => ii.InvoiceId == invoice.Id)
                .OrderBy(ii => ii.Id)
                .ToListAsync();
            long? lastBundleParentId = null;
            foreach (var ii in savedItems)
            {
                if (ii.BundleParentId == null)
                {
                    var prod = await _uow.Repository<Product>().GetByIdAsync(ii.ProductId);
                    if (prod?.IsBundle == true)
                        lastBundleParentId = ii.Id;
                    else
                        lastBundleParentId = null;
                }
                else if (ii.BundleParentId == -1 && lastBundleParentId != null)
                {
                    ii.BundleParentId = lastBundleParentId;
                }
            }
            await _uow.SaveChangesAsync();

            // 5. Update Inventory (decrease from the effective warehouse)
            foreach (var item in request.Items)
            {
                var product = await _uow.Repository<Product>().Query()
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.TenantId == _tenant.TenantId);

                if (product?.IsBundle == true)
                {
                    if (product.BundleHasOwnStock)
                    {
                        // Deduct from bundle's own inventory (same as regular product)
                        var bundleInv = await _uow.Repository<Inventory>().Query()
                            .FirstOrDefaultAsync(inv => inv.ProductId == product.Id && inv.WarehouseId == effectiveWarehouseId);
                        if (bundleInv != null)
                        {
                            bundleInv.Quantity -= item.Quantity;
                            bundleInv.LastUpdated = DateTime.UtcNow;
                            _uow.Repository<Inventory>().Update(bundleInv);
                        }
                    }
                    else
                    {
                        // Deduct from each component's stock
                        var bundleItems = await _uow.Repository<BundleItem>().Query()
                            .Where(bi => bi.ProductId == product.Id)
                            .ToListAsync();
                        foreach (var bi in bundleItems)
                        {
                            var compInv = await _uow.Repository<Inventory>().Query()
                                .FirstOrDefaultAsync(inv => inv.ProductId == bi.ComponentId && inv.WarehouseId == effectiveWarehouseId);
                            if (compInv != null)
                            {
                                compInv.Quantity -= bi.Quantity * item.Quantity;
                                compInv.LastUpdated = DateTime.UtcNow;
                                _uow.Repository<Inventory>().Update(compInv);
                            }
                        }
                    }
                    continue; // skip normal inventory deduction for bundle
                }

                var inventory = await _uow.Repository<Inventory>().Query()
                    .FirstOrDefaultAsync(i =>
                        i.TenantId == _tenant.TenantId &&
                        i.ProductId == item.ProductId &&
                        i.WarehouseId == effectiveWarehouseId);

                if (inventory is not null)
                {
                    var prevQty = inventory.Quantity;
                    inventory.Quantity -= item.Quantity;
                    inventory.LastUpdated = DateTime.UtcNow;
                    _uow.Repository<Inventory>().Update(inventory);

                    // 6. Create InventoryTransaction
                    var invTx = new InventoryTransaction
                    {
                        TenantId = _tenant.TenantId,
                        ProductId = item.ProductId,
                        WarehouseId = effectiveWarehouseId,
                        TransactionType = InventoryTransactionType.StockOut,
                        Quantity = item.Quantity,
                        PreviousQty = prevQty,
                        NewQty = inventory.Quantity,
                        ReferenceType = "Sale",
                        ReferenceId = invoice.Id.ToString(),
                        Notes = $"بيع - فاتورة {invoiceNumber}",
                        CreatedBy = _tenant.UserId,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _uow.Repository<InventoryTransaction>().AddAsync(invTx);

                    // 6.5. Low stock notification
                    if (inventory.Quantity <= 0)
                    {
                        var prodName = (await _uow.Repository<Product>().GetByIdAsync(item.ProductId))?.Name ?? $"#{item.ProductId}";
                        _ = _notif.SendAsync(null, $"نفاد مخزون: {prodName}", $"الرصيد وصل {inventory.Quantity} في المخزن", "warning", "Product", item.ProductId.ToString());
                    }
                    else
                    {
                        var prod = await _uow.Repository<Product>().GetByIdAsync(item.ProductId);
                        if (prod is not null && inventory.Quantity <= prod.MinStock)
                        {
                            _ = _notif.SendAsync(null, $"مخزون منخفض: {prod.Name}", $"الرصيد {inventory.Quantity} (الحد الأدنى: {prod.MinStock})", "warning", "Product", item.ProductId.ToString());
                        }
                    }
                }
            }
            await _uow.SaveChangesAsync();

            // 7. Update Contact balance if credit
            if (request.PaymentMethod == PaymentMethod.Credit && request.ContactId.HasValue && invoice.DueAmount > 0)
            {
                var contact = await _uow.Repository<Contact>().GetByIdAsync(request.ContactId.Value);
                if (contact is not null)
                {
                    contact.Balance += invoice.DueAmount;
                    contact.UpdatedAt = DateTime.UtcNow;
                    _uow.Repository<Contact>().Update(contact);
                    await _uow.SaveChangesAsync();
                }
            }

            // 8. Create FinanceTransaction if paid
            if (request.PaidAmount > 0)
            {
                var defaultAccount = await _uow.Repository<FinanceAccount>().Query()
                    .FirstOrDefaultAsync(a =>
                        a.TenantId == _tenant.TenantId &&
                        a.IsActive &&
                        !a.IsDeleted);

                if (defaultAccount is not null)
                {
                    var balanceBefore = defaultAccount.Balance;
                    defaultAccount.Balance += request.PaidAmount;
                    _uow.Repository<FinanceAccount>().Update(defaultAccount);

                    var finTx = new FinanceTransaction
                    {
                        TenantId = _tenant.TenantId,
                        AccountId = defaultAccount.Id,
                        TransactionType = TransactionType.Income,
                        Category = "مبيعات",
                        Amount = request.PaidAmount,
                        BalanceBefore = balanceBefore,
                        BalanceAfter = defaultAccount.Balance,
                        Description = $"بيع - فاتورة {invoiceNumber}",
                        ReferenceType = "Invoice",
                        ReferenceId = invoice.Id.ToString(),
                        CreatedBy = _tenant.UserId,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _uow.Repository<FinanceTransaction>().AddAsync(finTx);
                    await _uow.SaveChangesAsync();
                }
            }

            // 8.5. SalesRep ledger: record the taken items on the rep's account
            if (salesRep is not null)
            {
                salesRep.OutstandingBalance += invoice.TotalAmount;
                _uow.Repository<SalesRep>().Update(salesRep);

                var repTxn = new SalesRepTransaction
                {
                    SalesRepId = salesRep.Id,
                    TenantId = _tenant.TenantId,
                    TransactionType = SalesRepTxnType.ItemTaken,
                    Amount = invoice.TotalAmount,
                    BalanceAfter = salesRep.OutstandingBalance,
                    InvoiceId = invoice.Id,
                    Notes = $"بضاعة مسحوبة — فاتورة {invoiceNumber}",
                };
                await _uow.Repository<SalesRepTransaction>().AddAsync(repTxn);
                await _uow.SaveChangesAsync();

                // Notify admin if rep's balance exceeds 10,000
                if (salesRep.OutstandingBalance > 10_000)
                {
                    _ = _notif.SendAsync(null,
                        $"تنبيه: رصيد المندوب {salesRep.Name} مرتفع",
                        $"الرصيد المعلق: {salesRep.OutstandingBalance:N0}",
                        "danger", "SalesRep", salesRep.Id.ToString());
                }
            }

            // 9. Commit transaction
            await _uow.CommitTransactionAsync();
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<InvoiceDto>.Failure($"خطأ أثناء إنشاء فاتورة البيع: {ex.Message}");
        }

        // === Post-commit work (outside transaction, never fails the response) ===
        try { _ = _audit.LogAsync("CreateSale", "Invoice", invoice.Id.ToString(),
            newValues: $"Total={invoice.TotalAmount},Rep={invoice.SalesRepId},Warehouse={effectiveWarehouseId}"); } catch { }

        // Auto-post sale to GL (accounting side-effect; never blocks invoice creation).
        // Failures are captured in the PostingFailures audit table so admins can retry
        // them from /api/v1/admin/accounting/posting-failures.
        try
        {
            var postResult = await _salePostingService.PostSaleAsync(invoice.Id);
            if (!postResult.IsSuccess)
            {
                try { await _postingFailureLogger.LogAsync("Invoice", invoice.Id, "Sale", string.Join("; ", postResult.Errors)); } catch { }
            }
        }
        catch (Exception ex)
        {
            try { await _postingFailureLogger.LogAsync("Invoice", invoice.Id, "Sale", ex); } catch { }
        }

        var dto = await BuildInvoiceDto(invoice.Id);
        return Result<InvoiceDto>.Success(dto!, "تم إنشاء الفاتورة بنجاح");
    }

    public async Task<Result<InvoiceDto>> CreatePurchaseAsync(CreateInvoiceRequest request)
    {
        Invoice invoice;

        try
        {
            await _uow.BeginTransactionAsync();

            var purchaseCount = await _uow.Repository<Invoice>().CountAsync(i =>
                i.TenantId == _tenant.TenantId &&
                i.InvoiceType == InvoiceType.Purchase);
            var invoiceNumber = $"PUR-{(purchaseCount + 1):D6}";

            var invoiceItems = new List<InvoiceItem>();
            decimal subTotal = 0;
            decimal totalTax = 0;

            foreach (var item in request.Items)
            {
                var product = await _uow.Repository<Product>().Query()
                    .FirstOrDefaultAsync(p =>
                        p.Id == item.ProductId &&
                        p.TenantId == _tenant.TenantId &&
                        !p.IsDeleted);

                if (product is null)
                {
                    await _uow.RollbackTransactionAsync();
                    return Result<InvoiceDto>.Failure($"المنتج رقم {item.ProductId} غير موجود");
                }

                var lineTotal = item.Quantity * item.UnitPrice;
                var lineDiscount = item.DiscountAmount;
                var taxableAmount = lineTotal - lineDiscount;
                var lineTax = product.TaxRate.HasValue
                    ? taxableAmount * (product.TaxRate.Value / 100m)
                    : 0;

                invoiceItems.Add(new InvoiceItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    CostPrice = item.UnitPrice,
                    DiscountAmount = lineDiscount,
                    TaxAmount = Math.Round(lineTax, 2),
                    TotalPrice = Math.Round(taxableAmount + lineTax, 2)
                });

                product.CostPrice = item.UnitPrice;
                product.UpdatedAt = DateTime.UtcNow;
                _uow.Repository<Product>().Update(product);

                subTotal += lineTotal;
                totalTax += Math.Round(lineTax, 2);
            }

            var totalAmount = subTotal - request.DiscountAmount + totalTax;

            var paymentStatus = request.PaidAmount >= totalAmount
                ? PaymentStatus.Paid
                : request.PaidAmount > 0
                    ? PaymentStatus.Partial
                    : PaymentStatus.Unpaid;

            invoice = new Invoice
            {
                TenantId = _tenant.TenantId,
                InvoiceNumber = invoiceNumber,
                InvoiceType = InvoiceType.Purchase,
                InvoiceDate = DateTime.UtcNow,
                ContactId = request.ContactId,
                WarehouseId = request.WarehouseId,
                PriceType = request.PriceType,
                SubTotal = Math.Round(subTotal, 2),
                DiscountAmount = request.DiscountAmount,
                TaxAmount = Math.Round(totalTax, 2),
                TotalAmount = Math.Round(totalAmount, 2),
                PaidAmount = request.PaidAmount,
                DueAmount = Math.Round(totalAmount - request.PaidAmount, 2),
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = paymentStatus,
                Notes = request.Notes,
                CreatedBy = _tenant.UserId,
                FinanceAccountId = request.FinanceAccountId,
            };

            await _uow.Repository<Invoice>().AddAsync(invoice);
            await _uow.SaveChangesAsync();

            foreach (var item in invoiceItems)
            {
                item.InvoiceId = invoice.Id;
                await _uow.Repository<InvoiceItem>().AddAsync(item);
            }
            await _uow.SaveChangesAsync();

            // Add stock (StockIn)
            foreach (var item in request.Items)
            {
                var inventory = await _uow.Repository<Inventory>().Query()
                    .FirstOrDefaultAsync(i =>
                        i.TenantId == _tenant.TenantId &&
                        i.ProductId == item.ProductId &&
                        i.WarehouseId == request.WarehouseId);

                decimal prevQty = 0;

                if (inventory is not null)
                {
                    prevQty = inventory.Quantity;
                    inventory.Quantity += item.Quantity;
                    inventory.LastUpdated = DateTime.UtcNow;
                    _uow.Repository<Inventory>().Update(inventory);
                }
                else
                {
                    inventory = new Inventory
                    {
                        TenantId = _tenant.TenantId,
                        ProductId = item.ProductId,
                        WarehouseId = request.WarehouseId,
                        Quantity = item.Quantity,
                        ReservedQty = 0,
                        LastUpdated = DateTime.UtcNow
                    };
                    await _uow.Repository<Inventory>().AddAsync(inventory);
                }

                var invTx = new InventoryTransaction
                {
                    TenantId = _tenant.TenantId,
                    ProductId = item.ProductId,
                    WarehouseId = request.WarehouseId,
                    TransactionType = InventoryTransactionType.StockIn,
                    Quantity = item.Quantity,
                    PreviousQty = prevQty,
                    NewQty = prevQty + item.Quantity,
                    ReferenceType = "Purchase",
                    ReferenceId = invoice.Id.ToString(),
                    Notes = $"شراء - فاتورة {invoiceNumber}",
                    CreatedBy = _tenant.UserId,
                    CreatedAt = DateTime.UtcNow
                };
                await _uow.Repository<InventoryTransaction>().AddAsync(invTx);
            }
            await _uow.SaveChangesAsync();

            // Update supplier balance if credit
            if (request.PaymentMethod == PaymentMethod.Credit && request.ContactId.HasValue && invoice.DueAmount > 0)
            {
                var contact = await _uow.Repository<Contact>().GetByIdAsync(request.ContactId.Value);
                if (contact is not null)
                {
                    contact.Balance += invoice.DueAmount;
                    contact.UpdatedAt = DateTime.UtcNow;
                    _uow.Repository<Contact>().Update(contact);
                    await _uow.SaveChangesAsync();
                }
            }

            // Create expense transaction if paid
            if (request.PaidAmount > 0)
            {
                var defaultAccount = await _uow.Repository<FinanceAccount>().Query()
                    .FirstOrDefaultAsync(a =>
                        a.TenantId == _tenant.TenantId &&
                        a.IsActive &&
                        !a.IsDeleted);

                if (defaultAccount is not null)
                {
                    var balanceBefore = defaultAccount.Balance;
                    defaultAccount.Balance -= request.PaidAmount;
                    _uow.Repository<FinanceAccount>().Update(defaultAccount);

                    var finTx = new FinanceTransaction
                    {
                        TenantId = _tenant.TenantId,
                        AccountId = defaultAccount.Id,
                        TransactionType = TransactionType.Expense,
                        Category = "مشتريات",
                        Amount = request.PaidAmount,
                        BalanceBefore = balanceBefore,
                        BalanceAfter = defaultAccount.Balance,
                        Description = $"شراء - فاتورة {invoiceNumber}",
                        ReferenceType = "Invoice",
                        ReferenceId = invoice.Id.ToString(),
                        CreatedBy = _tenant.UserId,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _uow.Repository<FinanceTransaction>().AddAsync(finTx);
                    await _uow.SaveChangesAsync();
                }
            }

            await _uow.CommitTransactionAsync();
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<InvoiceDto>.Failure($"خطأ أثناء إنشاء فاتورة الشراء: {ex.Message}");
        }

        // === Post-commit work (outside transaction) ===
        var dto = await BuildInvoiceDto(invoice.Id);
        return Result<InvoiceDto>.Success(dto!, "تم إنشاء فاتورة الشراء بنجاح");
    }

    public async Task<Result<InvoiceDto>> CreateSaleReturnAsync(long originalInvoiceId, List<InvoiceItemRequest> items)
    {
        Invoice returnInvoice;

        try
        {
            await _uow.BeginTransactionAsync();

            var original = await _uow.Repository<Invoice>().Query()
                .FirstOrDefaultAsync(i =>
                    i.Id == originalInvoiceId &&
                    i.TenantId == _tenant.TenantId &&
                    i.InvoiceType == InvoiceType.Sale &&
                    !i.IsDeleted);

            if (original is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<InvoiceDto>.Failure("الفاتورة الأصلية غير موجودة");
            }

            var originalItems = await _uow.Repository<InvoiceItem>().Query()
                .Where(ii => ii.InvoiceId == originalInvoiceId)
                .ToListAsync();

            foreach (var item in items)
            {
                var origItem = originalItems.FirstOrDefault(oi => oi.ProductId == item.ProductId);
                if (origItem is null)
                {
                    await _uow.RollbackTransactionAsync();
                    return Result<InvoiceDto>.Failure($"المنتج رقم {item.ProductId} غير موجود في الفاتورة الأصلية");
                }
                if (item.Quantity > origItem.Quantity)
                {
                    await _uow.RollbackTransactionAsync();
                    return Result<InvoiceDto>.Failure($"كمية الإرجاع أكبر من الكمية المباعة للمنتج رقم {item.ProductId}");
                }
            }

            var returnCount = await _uow.Repository<Invoice>().CountAsync(i =>
                i.TenantId == _tenant.TenantId &&
                i.InvoiceType == InvoiceType.SaleReturn);
            var invoiceNumber = $"RET-{(returnCount + 1):D6}";

            var returnItems = new List<InvoiceItem>();
            decimal subTotal = 0;
            decimal totalTax = 0;

            foreach (var item in items)
            {
                var origItem = originalItems.First(oi => oi.ProductId == item.ProductId);
                var product = await _uow.Repository<Product>().Query()
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.TenantId == _tenant.TenantId);

                var lineTotal = item.Quantity * origItem.UnitPrice;
                var lineTax = product!.TaxRate.HasValue
                    ? lineTotal * (product.TaxRate.Value / 100m)
                    : 0;

                returnItems.Add(new InvoiceItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = origItem.UnitPrice,
                    CostPrice = origItem.CostPrice,
                    DiscountAmount = 0,
                    TaxAmount = Math.Round(lineTax, 2),
                    TotalPrice = Math.Round(lineTotal + lineTax, 2)
                });

                subTotal += lineTotal;
                totalTax += Math.Round(lineTax, 2);
            }

            var totalAmount = subTotal + totalTax;

            returnInvoice = new Invoice
            {
                TenantId = _tenant.TenantId,
                InvoiceNumber = invoiceNumber,
                InvoiceType = InvoiceType.SaleReturn,
                InvoiceDate = DateTime.UtcNow,
                ContactId = original.ContactId,
                WarehouseId = original.WarehouseId,
                PriceType = original.PriceType,
                SubTotal = Math.Round(subTotal, 2),
                DiscountAmount = 0,
                TaxAmount = Math.Round(totalTax, 2),
                TotalAmount = Math.Round(totalAmount, 2),
                PaidAmount = Math.Round(totalAmount, 2),
                DueAmount = 0,
                PaymentMethod = original.PaymentMethod,
                PaymentStatus = PaymentStatus.Paid,
                Notes = $"مرتجع من فاتورة {original.InvoiceNumber}",
                CreatedBy = _tenant.UserId,
                FinanceAccountId = original.FinanceAccountId,
            };

            await _uow.Repository<Invoice>().AddAsync(returnInvoice);
            await _uow.SaveChangesAsync();

            foreach (var item in returnItems)
            {
                item.InvoiceId = returnInvoice.Id;
                await _uow.Repository<InvoiceItem>().AddAsync(item);
            }
            await _uow.SaveChangesAsync();

            // Add stock back
            foreach (var item in items)
            {
                var inventory = await _uow.Repository<Inventory>().Query()
                    .FirstOrDefaultAsync(i =>
                        i.TenantId == _tenant.TenantId &&
                        i.ProductId == item.ProductId &&
                        i.WarehouseId == original.WarehouseId);

                if (inventory is not null)
                {
                    var prevQty = inventory.Quantity;
                    inventory.Quantity += item.Quantity;
                    inventory.LastUpdated = DateTime.UtcNow;
                    _uow.Repository<Inventory>().Update(inventory);

                    var invTx = new InventoryTransaction
                    {
                        TenantId = _tenant.TenantId,
                        ProductId = item.ProductId,
                        WarehouseId = original.WarehouseId,
                        TransactionType = InventoryTransactionType.Return,
                        Quantity = item.Quantity,
                        PreviousQty = prevQty,
                        NewQty = prevQty + item.Quantity,
                        ReferenceType = "SaleReturn",
                        ReferenceId = returnInvoice.Id.ToString(),
                        Notes = $"مرتجع بيع - فاتورة {invoiceNumber}",
                        CreatedBy = _tenant.UserId,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _uow.Repository<InventoryTransaction>().AddAsync(invTx);
                }
            }
            await _uow.SaveChangesAsync();

            // Create refund transaction
            var defaultAccount = await _uow.Repository<FinanceAccount>().Query()
                .FirstOrDefaultAsync(a =>
                    a.TenantId == _tenant.TenantId &&
                    a.IsActive &&
                    !a.IsDeleted);

            if (defaultAccount is not null)
            {
                var balanceBefore = defaultAccount.Balance;
                defaultAccount.Balance -= totalAmount;
                _uow.Repository<FinanceAccount>().Update(defaultAccount);

                var finTx = new FinanceTransaction
                {
                    TenantId = _tenant.TenantId,
                    AccountId = defaultAccount.Id,
                    TransactionType = TransactionType.Expense,
                    Category = "مرتجعات",
                    Amount = totalAmount,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = defaultAccount.Balance,
                    Description = $"مرتجع بيع - فاتورة {invoiceNumber}",
                    ReferenceType = "Invoice",
                    ReferenceId = returnInvoice.Id.ToString(),
                    CreatedBy = _tenant.UserId,
                    CreatedAt = DateTime.UtcNow
                };
                await _uow.Repository<FinanceTransaction>().AddAsync(finTx);
                await _uow.SaveChangesAsync();
            }

            // Update contact balance
            if (original.ContactId.HasValue)
            {
                var contact = await _uow.Repository<Contact>().GetByIdAsync(original.ContactId.Value);
                if (contact is not null && contact.Balance > 0)
                {
                    var deduction = Math.Min(contact.Balance, totalAmount);
                    contact.Balance -= deduction;
                    contact.UpdatedAt = DateTime.UtcNow;
                    _uow.Repository<Contact>().Update(contact);
                    await _uow.SaveChangesAsync();
                }
            }

            await _uow.CommitTransactionAsync();
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<InvoiceDto>.Failure($"خطأ أثناء إنشاء فاتورة المرتجع: {ex.Message}");
        }

        // === Post-commit work (outside transaction) ===
        // Auto-post sale return to GL (accounting side-effect; never blocks invoice creation).
        // Failures captured in PostingFailures audit table for retry.
        try
        {
            var postResult = await _salePostingService.PostSaleAsync(returnInvoice.Id);
            if (!postResult.IsSuccess)
            {
                try { await _postingFailureLogger.LogAsync("Invoice", returnInvoice.Id, "SaleReturn", string.Join("; ", postResult.Errors)); } catch { }
            }
        }
        catch (Exception ex)
        {
            try { await _postingFailureLogger.LogAsync("Invoice", returnInvoice.Id, "SaleReturn", ex); } catch { }
        }

        var dto = await BuildInvoiceDto(returnInvoice.Id);
        return Result<InvoiceDto>.Success(dto!, "تم إنشاء فاتورة المرتجع بنجاح");
    }

    public async Task<Result<PagedResult<InvoiceDto>>> SearchAsync(InvoiceSearchRequest request)
    {
        try
        {
            var query = _uow.Repository<Invoice>().Query()
                .AsNoTracking()
                .Where(i => i.TenantId == _tenant.TenantId && !i.IsDeleted);

            if (request.DateFrom.HasValue)
                query = query.Where(i => i.InvoiceDate >= request.DateFrom.Value);

            if (request.DateTo.HasValue)
                query = query.Where(i => i.InvoiceDate <= request.DateTo.Value.AddDays(1));

            if (request.ContactId.HasValue)
                query = query.Where(i => i.ContactId == request.ContactId.Value);

            if (request.PaymentMethod.HasValue)
                query = query.Where(i => i.PaymentMethod == request.PaymentMethod.Value);

            if (request.PaymentStatus.HasValue)
                query = query.Where(i => i.PaymentStatus == request.PaymentStatus.Value);

            if (request.InvoiceType.HasValue)
                query = query.Where(i => i.InvoiceType == request.InvoiceType.Value);

            var totalCount = await query.CountAsync();

            var invoices = await query
                .OrderByDescending(i => i.InvoiceDate)
                .ThenByDescending(i => i.Id)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var dtos = new List<InvoiceDto>();
            foreach (var inv in invoices)
            {
                var dto = await BuildInvoiceDto(inv.Id);
                if (dto is not null)
                    dtos.Add(dto);
            }

            var result = new PagedResult<InvoiceDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = request.Page,
                PageSize = request.PageSize
            };

            return Result<PagedResult<InvoiceDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<InvoiceDto>>.Failure($"خطأ أثناء البحث: {ex.Message}");
        }
    }

    public async Task<Result<InvoiceDto>> GetByIdAsync(long id)
    {
        try
        {
            var dto = await BuildInvoiceDto(id);
            if (dto is null)
                return Result<InvoiceDto>.Failure("الفاتورة غير موجودة");
            return Result<InvoiceDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<InvoiceDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    private async Task<InvoiceDto?> BuildInvoiceDto(long invoiceId)
    {
        var invoice = await _uow.Repository<Invoice>().Query()
            .FirstOrDefaultAsync(i =>
                i.Id == invoiceId &&
                i.TenantId == _tenant.TenantId);

        if (invoice is null) return null;

        string? contactName = null;
        if (invoice.ContactId.HasValue)
        {
            var contact = await _uow.Repository<Contact>().GetByIdAsync(invoice.ContactId.Value);
            contactName = contact?.Name;
        }

        var warehouse = await _uow.Repository<Warehouse>().GetByIdAsync(invoice.WarehouseId);
        var warehouseName = warehouse?.Name ?? "";

        var creator = await _uow.Repository<User>().GetByIdAsync(invoice.CreatedBy);
        var creatorName = creator?.FullName ?? "";

        string? salesRepName = null;
        if (invoice.SalesRepId.HasValue)
        {
            var rep = await _uow.Repository<SalesRep>().GetByIdAsync(invoice.SalesRepId.Value);
            salesRepName = rep?.Name;
        }

        var items = await _uow.Repository<InvoiceItem>().Query()
            .Where(ii => ii.InvoiceId == invoiceId)
            .ToListAsync();

        var itemDtos = new List<InvoiceItemDto>();
        foreach (var item in items)
        {
            var product = await _uow.Repository<Product>().GetByIdAsync(item.ProductId);
            string? unitName = null;
            if (product?.UnitId.HasValue == true)
            {
                var unit = await _uow.Repository<Unit>().GetByIdAsync(product.UnitId.Value);
                unitName = unit?.Name;
            }

            itemDtos.Add(new InvoiceItemDto(
                item.Id, item.ProductId,
                product?.Name ?? "",
                product?.Barcode,
                item.Quantity,
                unitName ?? "حبة",
                item.UnitPrice, item.CostPrice,
                item.DiscountAmount, item.TaxAmount, item.TotalPrice,
                item.BundleParentId));
        }

        return new InvoiceDto(
            invoice.Id, invoice.InvoiceNumber, invoice.InvoiceType, invoice.InvoiceDate,
            invoice.ContactId, contactName,
            invoice.WarehouseId, warehouseName,
            invoice.PriceType, invoice.SubTotal, invoice.DiscountAmount,
            invoice.TaxAmount, invoice.TotalAmount,
            invoice.PaidAmount, invoice.DueAmount,
            invoice.PaymentMethod, invoice.PaymentStatus,
            invoice.Notes, creatorName, itemDtos,
            invoice.ZatcaReported, invoice.ZatcaQrCode,
            invoice.SalesRepId, salesRepName,
            invoice.CurrencyCode, invoice.ExchangeRate, invoice.TotalInBaseCurrency,
            invoice.FinanceAccountId);
    }

    private static decimal CalcBundlePrice(Product bundle, List<BundleItem> items, PriceType priceType)
    {
        if (bundle.BundleDiscountType == Domain.Enums.BundleDiscountType.FixedPrice)
        {
            if (bundle.BundlePricingMode == Domain.Enums.BundlePricingMode.Unified)
                return bundle.RetailPrice;

            return priceType switch
            {
                PriceType.HalfWholesale => bundle.HalfWholesalePrice ?? bundle.RetailPrice,
                PriceType.Wholesale => bundle.WholesalePrice ?? bundle.RetailPrice,
                _ => bundle.RetailPrice,
            };
        }

        var componentSum = items.Sum(bi =>
        {
            var compPrice = priceType switch
            {
                PriceType.HalfWholesale => bi.Component?.HalfWholesalePrice ?? bi.Component?.RetailPrice ?? 0,
                PriceType.Wholesale => bi.Component?.WholesalePrice ?? bi.Component?.RetailPrice ?? 0,
                _ => bi.Component?.RetailPrice ?? 0,
            };
            return compPrice * bi.Quantity;
        });

        return bundle.BundleDiscountType switch
        {
            Domain.Enums.BundleDiscountType.Percent =>
                Math.Round(componentSum * (1 - (bundle.BundleDiscountValue ?? 0) / 100), 2),
            Domain.Enums.BundleDiscountType.FlatDiscount =>
                Math.Max(0, componentSum - (bundle.BundleDiscountValue ?? 0)),
            _ => componentSum,
        };
    }
}

// ════════════════════════════════════════════════════════════════
// 4. ContactService
// ════════════════════════════════════════════════════════════════

