using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.API.Authorization;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة شجرة الحسابات (عرض مسطّح، إضافة حساب فرعي، تعديل حقول قابلة للتغيير).</summary>
[Route("api/v1/accounting/chart-of-accounts")]
[Authorize]
[RequireModule(ModuleKey.Accounting)]
public class ChartOfAccountsController : BaseApiController
{
    private readonly IChartOfAccountService _service;

    public ChartOfAccountsController(IChartOfAccountService service) => _service = service;

    /// <summary>عرض كل حسابات الشجرة للتينانت الحالي (مسطّحة، مرتبة بالكود).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _service.GetAllAsync(ct);
        return HandleResult(result);
    }

    /// <summary>إنشاء حساب فرعي جديد تحت حساب تجميعي.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateChartOfAccountRequest request, CancellationToken ct)
    {
        var result = await _service.CreateAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>تعديل اسم/وصف/تفعيل حساب. الكود والفئة والطبيعة والأب غير قابلة للتعديل.</summary>
    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateChartOfAccountRequest request, CancellationToken ct)
    {
        var result = await _service.UpdateAsync(id, request, ct);
        return HandleResult(result);
    }
}
