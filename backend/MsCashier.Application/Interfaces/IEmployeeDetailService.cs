using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// HR: Enhanced Employee Service
// ============================================================
public interface IEmployeeDetailService
{
    Task<Result<EmployeeDetailDto>> CreateAsync(CreateEmployeeDetailRequest request);
    Task<Result<List<EmployeeDetailDto>>> GetAllAsync(bool? activeOnly);
    Task<Result<EmployeeDetailDto>> GetByIdAsync(int id);
    Task<Result<EmployeeDetailDto>> UpdateAsync(int id, UpdateEmployeeRequest request);
    Task<Result<bool>> DeleteAsync(int id);
}

// ============================================================
// Branch Management
// ============================================================

