using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IPdfService
{
    Task<Result<byte[]>> GenerateInvoicePdfAsync(long invoiceId);
}
