using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface ISalesRepService
{
    Task<Result<List<SalesRepDto>>> GetAllAsync();
    Task<Result<SalesRepDto>> GetByIdAsync(int id);
    Task<Result<SalesRepDto>> GetByUserIdAsync(Guid userId);
    Task<Result<SalesRepDto>> CreateAsync(CreateSalesRepRequest request);
    Task<Result<SalesRepDto>> UpdateAsync(int id, UpdateSalesRepRequest request);
    Task<Result<bool>> DeleteAsync(int id);

    // Ledger
    Task<Result<List<SalesRepTransactionDto>>> GetLedgerAsync(int salesRepId, DateTime? from = null, DateTime? to = null);

    // Payment Collection
    Task<Result<SalesRepTransactionDto>> CollectPaymentAsync(int salesRepId, CollectPaymentRequest request);

    // Commission
    Task<Result<SalesRepCommissionDto>> CalculateCommissionAsync(int salesRepId, int month, int year);
    Task<Result<List<SalesRepCommissionDto>>> GetCommissionsAsync(int salesRepId);
    Task<Result<SalesRepCommissionDto>> PayCommissionAsync(int commissionId, PayCommissionRequest request);

    // Summary & Reports
    Task<Result<SalesRepSummaryDto>> GetSummaryAsync();
    Task<Result<List<SalesRepPerformanceDto>>> GetPerformanceReportAsync(int month, int year);
}
