using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IFinanceService
{
    Task<Result<List<FinanceAccountDto>>> GetAccountsAsync();
    Task<Result<FinanceAccountDto>> CreateAccountAsync(string name, AccountType type);
    Task<Result<FinanceTransactionDto>> RecordTransactionAsync(CreateTransactionRequest request);
    Task<Result<PagedResult<FinanceTransactionDto>>> GetTransactionsAsync(int? accountId, DateTime? from, DateTime? to, int page, int pageSize);
    Task<Result<decimal>> GetTotalBalanceAsync();
}

