using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IDashboardService
{
    Task<Result<DashboardDto>> GetDashboardAsync(DateTime date);
}

