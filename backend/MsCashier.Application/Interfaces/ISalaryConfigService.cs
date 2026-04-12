using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// HR: Salary Configuration
// ============================================================
public interface ISalaryConfigService
{
    Task<Result<List<SalaryConfigDto>>> GetByEmployeeAsync(int employeeId);
    Task<Result<SalaryConfigDto>> SaveAsync(int? id, SaveSalaryConfigRequest request);
    Task<Result<bool>> DeleteAsync(int id);
}

