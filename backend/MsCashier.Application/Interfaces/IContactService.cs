using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IContactService
{
    Task<Result<ContactDto>> CreateAsync(CreateContactRequest request);
    Task<Result<PagedResult<ContactDto>>> SearchAsync(string? search, int? type, int page, int pageSize);
    Task<Result<ContactDto>> GetByIdAsync(int id);
    Task<Result<ContactDto>> UpdateAsync(int id, CreateContactRequest request);
    Task<Result<decimal>> GetBalanceAsync(int id);
    Task<Result<bool>> RecordPaymentAsync(int id, decimal amount, int accountId);
}

