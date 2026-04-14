using MsCashier.Domain.Common;

namespace MsCashier.Application.Services.Accounting.Posting;

public interface IPayrollPostingService
{
    Task<Result<long>> PostPayrollRunAsync(int payrollId, CancellationToken ct = default);
}
