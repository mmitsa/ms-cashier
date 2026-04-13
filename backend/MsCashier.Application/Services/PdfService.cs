using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MsCashier.Application.Services;

public class PdfService : IPdfService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly IInvoiceService _invoiceService;

    static PdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public PdfService(IUnitOfWork uow, ICurrentTenantService tenant, IInvoiceService invoiceService)
    {
        _uow = uow;
        _tenant = tenant;
        _invoiceService = invoiceService;
    }

    public async Task<Result<byte[]>> GenerateInvoicePdfAsync(long invoiceId)
    {
        try
        {
            // Get tenant info for header
            var tenantEntity = await _uow.Repository<Tenant>().Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == _tenant.TenantId);
            if (tenantEntity is null)
                return Result<byte[]>.Failure("المنشأة غير موجودة");

            // Get invoice via service
            var invoiceResult = await _invoiceService.GetByIdAsync(invoiceId);
            if (!invoiceResult.IsSuccess || invoiceResult.Data is null)
                return Result<byte[]>.Failure("الفاتورة غير موجودة");

            var inv = invoiceResult.Data;

            // Load store settings for invoice design
            StoreSettingsDto storeSettings;
            try
            {
                storeSettings = string.IsNullOrWhiteSpace(tenantEntity.Settings)
                    ? new StoreSettingsDto()
                    : System.Text.Json.JsonSerializer.Deserialize<StoreSettingsDto>(
                        tenantEntity.Settings,
                        new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase })
                      ?? new StoreSettingsDto();
            }
            catch { storeSettings = new StoreSettingsDto(); }

            var design = storeSettings.Invoice;

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);
                    page.DefaultTextStyle(x => x.FontSize(design.FontSize).FontFamily(design.FontFamily));
                    page.ContentFromRightToLeft();

                    // Header — uses store settings
                    page.Header().Column(col =>
                    {
                        if (!string.IsNullOrEmpty(design.HeaderText))
                            col.Item().Text(design.HeaderText).FontSize(8).FontColor(Colors.Grey.Medium);

                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text(storeSettings.StoreName ?? tenantEntity.Name).FontSize(18).Bold();
                                var phone = storeSettings.Phone1 ?? tenantEntity.Phone;
                                if (!string.IsNullOrEmpty(phone))
                                    c.Item().Text($"هاتف: {phone}").FontSize(9);
                                if (!string.IsNullOrEmpty(storeSettings.Phone2))
                                    c.Item().Text($"هاتف 2: {storeSettings.Phone2}").FontSize(9);
                                var addr = storeSettings.Address ?? tenantEntity.Address;
                                if (!string.IsNullOrEmpty(addr))
                                    c.Item().Text(addr).FontSize(9);
                                if (design.ShowTaxNumber && !string.IsNullOrEmpty(tenantEntity.VatNumber))
                                    c.Item().Text($"الرقم الضريبي: {tenantEntity.VatNumber}").FontSize(9);
                            });
                            row.ConstantItem(120).Column(c =>
                            {
                                c.Item().Text($"فاتورة {(inv.InvoiceType == Domain.Enums.InvoiceType.Sale ? "بيع" : "شراء")}").FontSize(14).Bold();
                                c.Item().Text($"رقم: {inv.InvoiceNumber}").FontSize(10);
                                c.Item().Text($"تاريخ: {inv.InvoiceDate:yyyy/MM/dd}").FontSize(9);
                            });
                        });
                        col.Item().PaddingVertical(5).LineHorizontal(1);
                        if (inv.ContactName is not null)
                            col.Item().Text($"العميل: {inv.ContactName}").FontSize(10);
                        if (inv.SalesRepName is not null)
                            col.Item().Text($"المندوب: {inv.SalesRepName}").FontSize(10);
                        col.Item().PaddingBottom(10);
                    });

                    // Content: Items table
                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.ConstantColumn(30);
                            c.RelativeColumn(3);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                            c.RelativeColumn(1);
                        });

                        // Header row
                        table.Header(h =>
                        {
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("#").Bold();
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("الصنف").Bold();
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("الكمية").Bold();
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("السعر").Bold();
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("الخصم").Bold();
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("الإجمالي").Bold();
                        });

                        var i = 1;
                        foreach (var item in inv.Items)
                        {
                            table.Cell().Padding(4).Text($"{i++}");
                            table.Cell().Padding(4).Text(item.ProductName);
                            table.Cell().Padding(4).Text($"{item.Quantity}");
                            table.Cell().Padding(4).Text($"{item.UnitPrice:N2}");
                            table.Cell().Padding(4).Text($"{item.DiscountAmount:N2}");
                            table.Cell().Padding(4).Text($"{item.TotalPrice:N2}").Bold();
                        }
                    });

                    // Footer: Totals
                    page.Footer().Column(col =>
                    {
                        col.Item().PaddingTop(10).LineHorizontal(1);
                        col.Item().PaddingTop(5).Row(row =>
                        {
                            row.RelativeItem();
                            row.ConstantItem(200).Column(c =>
                            {
                                c.Item().Row(r => { r.RelativeItem().Text("المجموع:"); r.ConstantItem(80).Text($"{inv.SubTotal:N2}").Bold(); });
                                if (inv.DiscountAmount > 0)
                                    c.Item().Row(r => { r.RelativeItem().Text("الخصم:"); r.ConstantItem(80).Text($"-{inv.DiscountAmount:N2}"); });
                                if (inv.TaxAmount > 0)
                                    c.Item().Row(r => { r.RelativeItem().Text("الضريبة:"); r.ConstantItem(80).Text($"+{inv.TaxAmount:N2}"); });
                                c.Item().PaddingTop(3).LineHorizontal(0.5f);
                                c.Item().Row(r => { r.RelativeItem().Text("الإجمالي:").FontSize(12).Bold(); r.ConstantItem(80).Text($"{inv.TotalAmount:N2}").FontSize(12).Bold(); });
                                c.Item().Row(r => { r.RelativeItem().Text("المدفوع:"); r.ConstantItem(80).Text($"{inv.PaidAmount:N2}"); });
                                if (inv.DueAmount > 0)
                                    c.Item().Row(r => { r.RelativeItem().Text("المتبقي:").Bold(); r.ConstantItem(80).Text($"{inv.DueAmount:N2}").Bold(); });
                                if (inv.CurrencyCode is not null)
                                    c.Item().PaddingTop(3).Text($"العملة: {inv.CurrencyCode}").FontSize(8).FontColor(Colors.Grey.Medium);
                            });
                        });

                        // Footer text from store settings
                        if (!string.IsNullOrEmpty(design.FooterText))
                            col.Item().PaddingTop(15).AlignCenter().Text(design.FooterText).FontSize(9).FontColor(Colors.Grey.Medium);
                    });
                });
            });

            var bytes = pdf.GeneratePdf();
            return Result<byte[]>.Success(bytes);
        }
        catch (Exception ex)
        {
            return Result<byte[]>.Failure($"خطأ في إنشاء PDF: {ex.Message}");
        }
    }
}
