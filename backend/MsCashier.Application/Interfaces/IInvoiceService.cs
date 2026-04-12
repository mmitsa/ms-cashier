using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IInvoiceService
{
    Task<Result<InvoiceDto>> CreateSaleAsync(CreateInvoiceRequest request);
    Task<Result<InvoiceDto>> CreatePurchaseAsync(CreateInvoiceRequest request);
    Task<Result<InvoiceDto>> CreateSaleReturnAsync(long originalInvoiceId, List<InvoiceItemRequest> items);
    Task<Result<InvoiceDto>> GetByIdAsync(long id);
    Task<Result<PagedResult<InvoiceDto>>> SearchAsync(InvoiceSearchRequest request);
}

