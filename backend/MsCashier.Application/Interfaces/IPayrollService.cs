using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// HR: Payroll Management
// ============================================================
public interface IPayrollService
{
    Task<Result<List<PayrollDetailDto>>> GeneratePayrollAsync(GeneratePayrollRequest request);
    Task<Result<bool>> ApprovePayrollAsync(ApprovePayrollRequest request, Guid approvedBy);
    Task<Result<PayrollCheckDto>> PayPayrollAsync(PayPayrollRequest request, Guid issuedBy);
    Task<Result<PagedResult<PayrollDetailDto>>> GetPayrollsAsync(PayrollFilterRequest filter);
    Task<Result<PayrollDetailDto>> GetByIdAsync(int id);
    Task<Result<PayslipDto>> GetPayslipAsync(int payrollId);
    Task<Result<List<PayrollMonthSummaryDto>>> GetMonthlyHistoryAsync(int? year);
    Task<Result<bool>> DeletePayrollAsync(int id);
}

