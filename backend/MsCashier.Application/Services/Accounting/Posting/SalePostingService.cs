using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Enums.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting.Posting;

/// <summary>
/// يترجم فاتورة البيع إلى قيد محاسبي ويرسله للمحرك.
/// </summary>
public class SalePostingService : ISalePostingService
{
    private readonly IUnitOfWork _uow;
    private readonly IJournalEntryService _journal;
    private readonly AccountResolver _resolver;
    private readonly ILogger<SalePostingService> _logger;

    public SalePostingService(
        IUnitOfWork uow,
        IJournalEntryService journal,
        AccountResolver resolver,
        ILogger<SalePostingService> logger)
    {
        _uow = uow;
        _journal = journal;
        _resolver = resolver;
        _logger = logger;
    }

    public async Task<Result<long>> PostSaleAsync(long invoiceId, CancellationToken ct = default)
    {
        var invoice = await _uow.Repository<Invoice>().Query()
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == invoiceId, ct);

        if (invoice is null)
            return Result<long>.Failure($"الفاتورة رقم {invoiceId} غير موجودة");

        if (invoice.InvoiceType != InvoiceType.Sale && invoice.InvoiceType != InvoiceType.SaleReturn)
            return Result<long>.Failure("القيد المحاسبي للبيع يُطبَّق فقط على فواتير البيع");

        var net = invoice.SubTotal - invoice.DiscountAmount;
        var tax = invoice.TaxAmount;
        var total = invoice.TotalAmount;

        if (total <= 0)
            return Result<long>.Failure("إجمالي الفاتورة صفر — لا يوجد ما يُرحَّل محاسبياً");

        var lines = new List<JournalLineDto>();

        // الطرف المدين: نقدية / ذمم مدينة / مزيج منهما حسب المدفوع.
        //
        // Rules:
        //   1) PaymentMethod == Credit OR PaidAmount == 0  → full credit sale: Dr AR (total).
        //   2) PaidAmount >= TotalAmount                   → full cash sale:   Dr Cash (total).
        //   3) 0 < PaidAmount < TotalAmount                → partial: Dr Cash (PaidAmount),
        //                                                              Dr AR  (Total - PaidAmount).
        //
        // Cash-leg GL account precedence:
        //   1) invoice.FinanceAccount.ChartOfAccountId  (explicit link to the exact cashier/bank leaf)
        //   2) PaymentMethod-based code map (ResolveCashSideAccountCode)
        //   3) "1101" fallback inside the map for unknown methods
        var paid = invoice.PaidAmount;
        var isFullCredit = invoice.PaymentMethod == PaymentMethod.Credit || paid == 0m;
        var isFullCash = !isFullCredit && paid >= total;

        var cashSideCode = ResolveCashSideAccountCode(invoice.PaymentMethod);
        var cashSideDesc = CashSideDescription(invoice.PaymentMethod);

        if (isFullCredit)
        {
            var arId = await _resolver.GetAccountIdByCodeAsync("1130", ct); // Accounts Receivable
            lines.Add(new JournalLineDto(
                AccountId: arId,
                Debit: total,
                Credit: 0m,
                Description: $"ذمم مدينة عن الفاتورة {invoice.InvoiceNumber}",
                ContactId: invoice.ContactId));
        }
        else if (isFullCash)
        {
            var cashId = await ResolveCashAccountIdAsync(invoice, cashSideCode, ct);
            lines.Add(new JournalLineDto(
                AccountId: cashId,
                Debit: total,
                Credit: 0m,
                Description: $"{cashSideDesc} — فاتورة {invoice.InvoiceNumber}"));
        }
        else
        {
            // Partial payment: split between the payment-method cash leg and AR.
            var cashId = await ResolveCashAccountIdAsync(invoice, cashSideCode, ct);
            var arId = await _resolver.GetAccountIdByCodeAsync("1130", ct);
            var outstanding = total - paid;

            lines.Add(new JournalLineDto(
                AccountId: cashId,
                Debit: paid,
                Credit: 0m,
                Description: $"{cashSideDesc} (دفعة جزئية) — فاتورة {invoice.InvoiceNumber}"));

            lines.Add(new JournalLineDto(
                AccountId: arId,
                Debit: outstanding,
                Credit: 0m,
                Description: $"ذمم مدينة — المتبقي على الفاتورة {invoice.InvoiceNumber}",
                ContactId: invoice.ContactId));
        }

        // الطرف الدائن: مبيعات + ضريبة مخرجات
        var salesId = await _resolver.GetAccountIdByCodeAsync("4101", ct);
        lines.Add(new JournalLineDto(
            AccountId: salesId,
            Debit: 0m,
            Credit: net,
            Description: $"مبيعات — فاتورة {invoice.InvoiceNumber}"));

        if (tax > 0)
        {
            var vatId = await _resolver.GetAccountIdByCodeAsync("2120", ct);
            lines.Add(new JournalLineDto(
                AccountId: vatId,
                Debit: 0m,
                Credit: tax,
                Description: $"ضريبة القيمة المضافة — فاتورة {invoice.InvoiceNumber}"));
        }

        // COGS: مدين تكلفة البضاعة المباعة، دائن المخزون
        var totalCost = invoice.Items?.Sum(it => it.CostPrice * it.Quantity) ?? 0m;
        if (totalCost > 0)
        {
            var cogsId = await _resolver.GetAccountIdByCodeAsync("5101", ct);
            var inventoryId = await _resolver.GetAccountIdByCodeAsync("1140", ct);

            lines.Add(new JournalLineDto(
                AccountId: cogsId,
                Debit: totalCost,
                Credit: 0m,
                Description: $"تكلفة بضاعة مباعة — فاتورة {invoice.InvoiceNumber}"));

            lines.Add(new JournalLineDto(
                AccountId: inventoryId,
                Debit: 0m,
                Credit: totalCost,
                Description: $"مخزون صادر — فاتورة {invoice.InvoiceNumber}"));
        }

        var dto = new CreateJournalEntryDto(
            EntryDate: invoice.InvoiceDate,
            Source: JournalSource.Sale,
            Lines: lines,
            Reference: invoice.InvoiceNumber,
            DescriptionAr: $"قيد فاتورة بيع رقم {invoice.InvoiceNumber}",
            DescriptionEn: $"Sale invoice {invoice.InvoiceNumber}",
            SourceType: "Invoice",
            SourceId: invoice.Id,
            BranchId: null);

        return await _journal.CreateAndPostAsync(dto, ct);
    }

    /// <summary>
    /// Resolves the cash-side GL account id with the following precedence:
    ///   1) invoice.FinanceAccount.ChartOfAccountId  (explicit cashier/bank/wallet link)
    ///   2) PaymentMethod-based code map
    ///   3) "1101" fallback (inside the map)
    /// </summary>
    private async Task<int> ResolveCashAccountIdAsync(Invoice invoice, string fallbackCode, CancellationToken ct)
    {
        if (invoice.FinanceAccountId is int faId && faId > 0)
        {
            var fa = await _uow.Repository<FinanceAccount>().Query()
                .FirstOrDefaultAsync(a =>
                    a.Id == faId &&
                    a.TenantId == invoice.TenantId &&
                    !a.IsDeleted, ct);

            if (fa?.ChartOfAccountId is int coaId)
            {
                var coa = await _uow.Repository<ChartOfAccount>().Query()
                    .FirstOrDefaultAsync(a =>
                        a.Id == coaId &&
                        a.TenantId == invoice.TenantId &&
                        !a.IsGroup &&
                        !a.IsDeleted, ct);
                if (coa is not null)
                    return coa.Id;
            }

            _logger.LogWarning(
                "Invoice {InvoiceId} FinanceAccount {FaId} has no usable GL link — falling back to code {Code}.",
                invoice.Id, faId, fallbackCode);
        }

        return await _resolver.GetAccountIdByCodeAsync(fallbackCode, ct);
    }

    private static string ResolveCashSideAccountCode(PaymentMethod method) => method switch
    {
        PaymentMethod.Cash         => "1101", // Main Cash
        PaymentMethod.Visa         => "1120", // Card Payments Clearing
        PaymentMethod.Instapay     => "1120",
        PaymentMethod.Tabby        => "1120",
        PaymentMethod.Tamara       => "1120",
        PaymentMethod.ValU         => "1120",
        PaymentMethod.BankTransfer => "1101", // TODO: resolve specific bank FinanceAccount
        PaymentMethod.Installment  => "1101", // down-payment portion only
        _                          => "1101", // documented fallback
    };

    private static string CashSideDescription(PaymentMethod method) => method switch
    {
        PaymentMethod.Cash         => "نقدية محصلة",
        PaymentMethod.Visa         => "مدفوعات شبكة تحت التحصيل",
        PaymentMethod.Instapay     => "مدفوعات إنستاباي تحت التحصيل",
        PaymentMethod.Tabby        => "مدفوعات تابي تحت التحصيل",
        PaymentMethod.Tamara       => "مدفوعات تمارا تحت التحصيل",
        PaymentMethod.ValU         => "مدفوعات ڤاليو تحت التحصيل",
        PaymentMethod.BankTransfer => "تحويل بنكي",
        PaymentMethod.Installment  => "دفعة مقدمة نقدية",
        _                          => "نقدية محصلة",
    };
}
