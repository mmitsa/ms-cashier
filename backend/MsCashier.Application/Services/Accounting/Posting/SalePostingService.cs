using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
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

    public SalePostingService(IUnitOfWork uow, IJournalEntryService journal, AccountResolver resolver)
    {
        _uow = uow;
        _journal = journal;
        _resolver = resolver;
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
        // Cash side resolution: the invoice does not currently carry a FinanceAccountId/PaymentTerminalId
        // linkage from which to derive the tenant's specific cash/bank leaf. We therefore default to
        // system code "1101" (Main Cash). TODO: once invoices capture the terminal/cash-drawer FinanceAccountId,
        // resolve via FinanceAccount.ChartOfAccountId for per-terminal cash posting.
        var paid = invoice.PaidAmount;
        var isFullCredit = invoice.PaymentMethod == PaymentMethod.Credit || paid == 0m;
        var isFullCash = !isFullCredit && paid >= total;

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
            var cashId = await _resolver.GetAccountIdByCodeAsync("1101", ct);
            lines.Add(new JournalLineDto(
                AccountId: cashId,
                Debit: total,
                Credit: 0m,
                Description: $"نقدية محصلة من الفاتورة {invoice.InvoiceNumber}"));
        }
        else
        {
            // Partial payment: split between cash and AR.
            var cashId = await _resolver.GetAccountIdByCodeAsync("1101", ct);
            var arId = await _resolver.GetAccountIdByCodeAsync("1130", ct);
            var outstanding = total - paid;

            lines.Add(new JournalLineDto(
                AccountId: cashId,
                Debit: paid,
                Credit: 0m,
                Description: $"دفعة جزئية نقدية — فاتورة {invoice.InvoiceNumber}"));

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
}
