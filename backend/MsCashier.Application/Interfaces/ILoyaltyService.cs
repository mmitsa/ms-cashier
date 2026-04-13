using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface ILoyaltyService
{
    Task<Result<LoyaltyProgramDto?>> GetProgramAsync();
    Task<Result<LoyaltyProgramDto>> CreateOrUpdateProgramAsync(CreateLoyaltyProgramRequest request);
    Task<Result<CustomerLoyaltyDto>> GetCustomerLoyaltyAsync(int contactId);
    Task<Result<CustomerLoyaltyDto>> EnrollCustomerAsync(int contactId);
    Task<Result<LoyaltyTransactionDto>> EarnPointsAsync(int contactId, long invoiceId, decimal totalAmount);
    Task<Result<decimal>> RedeemPointsAsync(int contactId, int points);
    Task<Result<PagedResult<LoyaltyTransactionDto>>> GetTransactionsAsync(int contactId, int page, int pageSize);
    Task<Result<LoyaltyDashboardDto>> GetDashboardAsync();
}
