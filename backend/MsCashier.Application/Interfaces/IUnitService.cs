using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IUnitService
{
    Task<Result<List<UnitDto>>> GetAllAsync();
    Task<Result<UnitDto>> GetByIdAsync(int id);
    Task<Result<UnitDto>> CreateAsync(CreateUnitRequest request);
    Task<Result<UnitDto>> UpdateAsync(int id, UpdateUnitRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<decimal>> ConvertAsync(int fromUnitId, int toUnitId, decimal quantity);
}
