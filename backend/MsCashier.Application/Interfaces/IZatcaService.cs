using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ZATCA
public interface IZatcaService
{
    Task<Result<string>> GenerateInvoiceXmlAsync(long invoiceId);
    Task<Result<string>> GenerateQrCodeAsync(long invoiceId);
    Task<Result<bool>> ReportInvoiceAsync(long invoiceId);
    Task<Result<bool>> ClearInvoiceAsync(long invoiceId);
}

