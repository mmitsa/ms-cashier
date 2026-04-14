using MsCashier.Application.DTOs.Accounting;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces.Accounting;

/// <summary>خدمة إدارة شجرة الحسابات (قراءة، إضافة حساب فرعي، تعديل الحقول القابلة للتغيير).</summary>
public interface IChartOfAccountService
{
    Task<Result<IReadOnlyList<ChartOfAccountDto>>> GetAllAsync(CancellationToken ct = default);
    Task<Result<ChartOfAccountDto>> CreateAsync(CreateChartOfAccountRequest request, CancellationToken ct = default);
    Task<Result<ChartOfAccountDto>> UpdateAsync(int id, UpdateChartOfAccountRequest request, CancellationToken ct = default);
}
