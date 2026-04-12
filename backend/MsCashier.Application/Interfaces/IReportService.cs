using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IReportService
{
    Task<Result<SalesReportDto>> GetSalesReportAsync(DateTime from, DateTime to, int? categoryId, int? contactId);
    Task<Result<ProfitReportDto>> GetProfitReportAsync(DateTime from, DateTime to, int? productId);
}

