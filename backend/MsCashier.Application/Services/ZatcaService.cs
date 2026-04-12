using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Xml.Linq;
using Microsoft.EntityFrameworkCore;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services;

/// <summary>
/// ZATCA (Saudi e-invoicing) integration service for Phase 2 simplified and standard tax invoices.
/// </summary>
public class ZatcaService : IZatcaService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    private const string UblInvoiceNs = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
    private const string UblCacNs = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
    private const string UblCbcNs = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
    private const decimal VatRate = 15m;

    public ZatcaService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    /// <inheritdoc />
    public async Task<Result<string>> GenerateInvoiceXmlAsync(long invoiceId)
    {
        try
        {
            var (invoice, tenant, contact, items) = await GetInvoiceDataAsync(invoiceId);
            if (invoice is null)
                return Result<string>.Failure("الفاتورة غير موجودة");

            if (tenant is null)
                return Result<string>.Failure("بيانات المورد غير متوفرة");

            var doc = BuildUblInvoice(invoice, tenant, contact, items);
            var xml = doc.ToString(SaveOptions.DisableFormatting);
            return Result<string>.Success(xml);
        }
        catch (Exception ex)
        {
            return Result<string>.Failure($"خطأ أثناء إنشاء XML: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<Result<string>> GenerateQrCodeAsync(long invoiceId)
    {
        try
        {
            var (invoice, tenant, _, _) = await GetInvoiceDataAsync(invoiceId);
            if (invoice is null)
                return Result<string>.Failure("الفاتورة غير موجودة");

            if (tenant is null)
                return Result<string>.Failure("بيانات المورد غير متوفرة");

            var qrData = BuildTlvQrCode(invoice, tenant);
            var base64 = Convert.ToBase64String(qrData);

            // Update invoice with QR code
            invoice.ZatcaQrCode = base64;
            _uow.Repository<Invoice>().Update(invoice);
            await _uow.SaveChangesAsync();

            return Result<string>.Success(base64);
        }
        catch (Exception ex)
        {
            return Result<string>.Failure($"خطأ أثناء إنشاء رمز QR: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<Result<bool>> ReportInvoiceAsync(long invoiceId)
    {
        try
        {
            var invoice = await _uow.Repository<Invoice>().Query()
                .FirstOrDefaultAsync(i => i.Id == invoiceId && i.TenantId == _tenant.TenantId);

            if (invoice is null)
                return Result<bool>.Failure("الفاتورة غير موجودة");

            if (invoice.ZatcaReported)
                return Result<bool>.Success(true, "تم الإبلاغ عن الفاتورة مسبقاً");

            var xmlResult = await GenerateInvoiceXmlAsync(invoiceId);
            if (!xmlResult.IsSuccess || xmlResult.Data is null)
                return Result<bool>.Failure(xmlResult.Errors.FirstOrDefault() ?? "فشل إنشاء XML");

            var qrResult = await GenerateQrCodeAsync(invoiceId);
            if (!qrResult.IsSuccess)
                return Result<bool>.Failure(qrResult.Errors.FirstOrDefault() ?? "فشل إنشاء رمز QR");

            invoice.ZatcaQrCode = qrResult.Data;

            var xmlBytes = Encoding.UTF8.GetBytes(xmlResult.Data);
            var hashBytes = SHA256.HashData(xmlBytes);
            var hash = Convert.ToHexString(hashBytes).ToLowerInvariant();

            // Simulate ZATCA reporting API call
            Trace.WriteLine($"[ZATCA] Simulated report for invoice {invoice.InvoiceNumber}, hash: {hash}");

            invoice.ZatcaReported = true;
            invoice.ZatcaInvoiceHash = hash;
            _uow.Repository<Invoice>().Update(invoice);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم الإبلاغ عن الفاتورة بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ أثناء الإبلاغ: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<Result<bool>> ClearInvoiceAsync(long invoiceId)
    {
        try
        {
            var invoice = await _uow.Repository<Invoice>().Query()
                .FirstOrDefaultAsync(i => i.Id == invoiceId && i.TenantId == _tenant.TenantId);

            if (invoice is null)
                return Result<bool>.Failure("الفاتورة غير موجودة");

            var xmlResult = await GenerateInvoiceXmlAsync(invoiceId);
            if (!xmlResult.IsSuccess || xmlResult.Data is null)
                return Result<bool>.Failure(xmlResult.Errors.FirstOrDefault() ?? "فشل إنشاء XML");

            // Simulate ZATCA clearing API call (for B2B standard tax invoices)
            Trace.WriteLine($"[ZATCA] Simulated clearance for invoice {invoice.InvoiceNumber}");

            if (!invoice.ZatcaReported)
            {
                var qrResult = await GenerateQrCodeAsync(invoiceId);
                if (!qrResult.IsSuccess)
                    return Result<bool>.Failure(qrResult.Errors.FirstOrDefault() ?? "فشل إنشاء رمز QR");

                var xmlBytes = Encoding.UTF8.GetBytes(xmlResult.Data);
                var hashBytes = SHA256.HashData(xmlBytes);
                invoice.ZatcaInvoiceHash = Convert.ToHexString(hashBytes).ToLowerInvariant();
            }

            invoice.ZatcaReported = true;
            _uow.Repository<Invoice>().Update(invoice);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم التخليص بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ أثناء التخليص: {ex.Message}");
        }
    }

    private async Task<(Invoice? invoice, Tenant? tenant, Contact? contact, List<InvoiceItem> items)> GetInvoiceDataAsync(long invoiceId)
    {
        var invoice = await _uow.Repository<Invoice>().Query()
            .Include(i => i.Items)
            .Include(i => i.Contact)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.TenantId == _tenant.TenantId);

        if (invoice is null)
            return (null, null, null, new List<InvoiceItem>());

        var tenant = await _uow.Repository<Tenant>().GetByIdAsync(invoice.TenantId);
        var contact = invoice.Contact;
        var items = invoice.Items?.ToList() ?? new List<InvoiceItem>();

        // Load product names for items
        foreach (var item in items)
        {
            if (item.Product is null)
            {
                var product = await _uow.Repository<Product>().GetByIdAsync(item.ProductId);
                if (product is not null)
                    item.Product = product;
            }
        }

        return (invoice, tenant, contact, items);
    }

    private XDocument BuildUblInvoice(Invoice invoice, Tenant tenant, Contact? contact, List<InvoiceItem> items)
    {
        var xCbc = XNamespace.Get(UblCbcNs);
        var xCac = XNamespace.Get(UblCacNs);
        var xInvoice = XNamespace.Get(UblInvoiceNs);

        var issueDate = invoice.InvoiceDate.Date;
        var issueTime = invoice.InvoiceDate.TimeOfDay;

        // InvoiceTypeCode: 388 = Simplified Tax Invoice, 380 = Tax Invoice (standard B2B)
        var invoiceTypeCode = invoice.ContactId.HasValue && contact?.TaxNumber != null ? "380" : "388";

        var doc = new XDocument(
            new XDeclaration("1.0", "UTF-8", null),
            new XElement(xInvoice + "Invoice",
                new XAttribute(XNamespace.Xmlns + "cbc", UblCbcNs),
                new XAttribute(XNamespace.Xmlns + "cac", UblCacNs),
                new XElement(xCbc + "ID", invoice.InvoiceNumber),
                new XElement(xCbc + "IssueDate", issueDate.ToString("yyyy-MM-dd")),
                new XElement(xCbc + "IssueTime", $"{issueTime.Hours:D2}:{issueTime.Minutes:D2}:{issueTime.Seconds:D2}"),
                new XElement(xCbc + "InvoiceTypeCode", invoiceTypeCode),
                new XElement(xCbc + "DocumentCurrencyCode", tenant.CurrencyCode),
                BuildAccountingSupplierParty(xCac, xCbc, tenant),
                BuildAccountingCustomerParty(xCac, xCbc, contact),
                BuildInvoiceLines(xCac, xCbc, items),
                BuildTaxTotal(xCac, xCbc, invoice),
                BuildLegalMonetaryTotal(xCac, xCbc, invoice)
            )
        );

        return doc;
    }

    private XElement BuildAccountingSupplierParty(XNamespace xCac, XNamespace xCbc, Tenant tenant)
    {
        return new XElement(xCac + "AccountingSupplierParty",
            new XElement(xCac + "Party",
                new XElement(xCac + "PartyIdentification",
                    new XElement(xCbc + "ID", tenant.VatNumber ?? tenant.TaxNumber ?? "")),
                new XElement(xCac + "PartyName",
                    new XElement(xCbc + "Name", tenant.Name)),
                new XElement(xCac + "PostalAddress",
                    new XElement(xCbc + "StreetName", tenant.Address ?? ""),
                    new XElement(xCbc + "CityName", tenant.City),
                    new XElement(xCbc + "BuildingNumber", "0"),
                    new XElement(xCbc + "PlotIdentification", "0")),
                new XElement(xCac + "PartyTaxScheme",
                    new XElement(xCac + "TaxScheme",
                        new XElement(xCbc + "ID", "VAT")))));
    }

    private XElement BuildAccountingCustomerParty(XNamespace xCac, XNamespace xCbc, Contact? contact)
    {
        var partyName = contact?.Name ?? "عميل نقدي";
        var taxId = contact?.TaxNumber ?? "";

        return new XElement(xCac + "AccountingCustomerParty",
            new XElement(xCac + "Party",
                new XElement(xCac + "PartyIdentification",
                    new XElement(xCbc + "ID", string.IsNullOrEmpty(taxId) ? "N/A" : taxId)),
                new XElement(xCac + "PartyName",
                    new XElement(xCbc + "Name", partyName)),
                new XElement(xCac + "PostalAddress",
                    new XElement(xCbc + "StreetName", contact?.Address ?? ""),
                    new XElement(xCbc + "CityName", "Riyadh"),
                    new XElement(xCbc + "BuildingNumber", "0"),
                    new XElement(xCbc + "PlotIdentification", "0"))));
    }

    private XElement[] BuildInvoiceLines(XNamespace xCac, XNamespace xCbc, List<InvoiceItem> items)
    {
        var lines = new List<XElement>();
        var lineNum = 1;

        foreach (var item in items)
        {
            var productName = item.Product?.Name ?? $"Product {item.ProductId}";
            var lineExtensionAmount = item.TotalPrice - item.TaxAmount;
            var taxAmount = item.TaxAmount;

            var line = new XElement(xCac + "InvoiceLine",
                new XElement(xCbc + "ID", lineNum.ToString()),
                new XElement(xCbc + "InvoicedQuantity", item.Quantity.ToString("F2")),
                new XElement(xCbc + "LineExtensionAmount", lineExtensionAmount.ToString("F2")),
                new XElement(xCac + "Item",
                    new XElement(xCbc + "Name", productName)),
                new XElement(xCac + "Price",
                    new XElement(xCbc + "PriceAmount", item.UnitPrice.ToString("F2"))),
                new XElement(xCac + "TaxTotal",
                    new XElement(xCbc + "TaxAmount", taxAmount.ToString("F2")),
                    new XElement(xCac + "TaxSubtotal",
                        new XElement(xCbc + "TaxableAmount", lineExtensionAmount.ToString("F2")),
                        new XElement(xCbc + "TaxAmount", taxAmount.ToString("F2")),
                        new XElement(xCac + "TaxCategory",
                            new XElement(xCbc + "ID", "S"),
                            new XElement(xCbc + "Percent", VatRate.ToString("F2")),
                            new XElement(xCac + "TaxScheme",
                                new XElement(xCbc + "ID", "VAT")))))
            );
            lines.Add(line);
            lineNum++;
        }

        return lines.ToArray();
    }

    private XElement BuildTaxTotal(XNamespace xCac, XNamespace xCbc, Invoice invoice)
    {
        var taxableAmount = invoice.SubTotal - invoice.DiscountAmount;

        return new XElement(xCac + "TaxTotal",
            new XElement(xCbc + "TaxAmount", invoice.TaxAmount.ToString("F2")),
            new XElement(xCac + "TaxSubtotal",
                new XElement(xCbc + "TaxableAmount", taxableAmount.ToString("F2")),
                new XElement(xCbc + "TaxAmount", invoice.TaxAmount.ToString("F2")),
                new XElement(xCac + "TaxCategory",
                    new XElement(xCbc + "ID", "S"),
                    new XElement(xCbc + "Percent", VatRate.ToString("F2")),
                    new XElement(xCac + "TaxScheme",
                        new XElement(xCbc + "ID", "VAT")))));
    }

    private XElement BuildLegalMonetaryTotal(XNamespace xCac, XNamespace xCbc, Invoice invoice)
    {
        return new XElement(xCac + "LegalMonetaryTotal",
            new XElement(xCbc + "LineExtensionAmount", (invoice.SubTotal - invoice.DiscountAmount).ToString("F2")),
            new XElement(xCbc + "TaxExclusiveAmount", (invoice.SubTotal - invoice.DiscountAmount).ToString("F2")),
            new XElement(xCbc + "TaxInclusiveAmount", invoice.TotalAmount.ToString("F2")),
            new XElement(xCbc + "AllowanceTotalAmount", invoice.DiscountAmount.ToString("F2")),
            new XElement(xCbc + "PayableAmount", invoice.TotalAmount.ToString("F2")));
    }

    private static byte[] BuildTlvQrCode(Invoice invoice, Tenant tenant)
    {
        var sellerName = tenant.Name ?? "";
        var vatNumber = tenant.VatNumber ?? tenant.TaxNumber ?? "";
        var timestamp = invoice.InvoiceDate.ToUniversalTime().AddHours(3).ToString("yyyy-MM-ddTHH:mm:ssZ");
        var totalAmount = invoice.TotalAmount.ToString("F2");
        var vatAmount = invoice.TaxAmount.ToString("F2");

        using var ms = new MemoryStream();

        void AppendTlv(byte tag, string value)
        {
            var valueBytes = Encoding.UTF8.GetBytes(value);
            if (valueBytes.Length > 255)
                valueBytes = valueBytes.Take(255).ToArray();
            ms.WriteByte(tag);
            ms.WriteByte((byte)valueBytes.Length);
            ms.Write(valueBytes, 0, valueBytes.Length);
        }

        AppendTlv(1, sellerName);
        AppendTlv(2, vatNumber);
        AppendTlv(3, timestamp);
        AppendTlv(4, totalAmount);
        AppendTlv(5, vatAmount);

        return ms.ToArray();
    }
}
