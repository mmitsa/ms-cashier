using MsCashier.Application.DTOs.Accounting;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces.Accounting;

public interface IAccountingReportsService
{
    Task<Result<TrialBalanceDto>> GetTrialBalanceAsync(DateTime fromDate, DateTime toDate, int? branchId = null, CancellationToken ct = default);
    Task<Result<IncomeStatementDto>> GetIncomeStatementAsync(DateTime fromDate, DateTime toDate, int? branchId = null, CancellationToken ct = default);
    Task<Result<BalanceSheetDto>> GetBalanceSheetAsync(DateTime asOfDate, int? branchId = null, CancellationToken ct = default);
    Task<Result<ContactStatementDto>> GetContactStatementAsync(int contactId, DateTime fromDate, DateTime toDate, CancellationToken ct = default);
}
