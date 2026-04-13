using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;

namespace MsCashier.API.Controllers;

/// <summary>إدارة مندوبي المبيعات والعمولات</summary>
[Route("api/v1/sales-reps")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SalesRepsController : BaseApiController
{
    private readonly ISalesRepService _service;

    public SalesRepsController(ISalesRepService service) => _service = service;

    /// <summary>عرض جميع مندوبي المبيعات</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    /// <summary>عرض بيانات المندوب المرتبط بالمستخدم الحالي</summary>
    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> GetMine()
        => HandleResult(await _service.GetByUserIdAsync(Guid.Parse(User.FindFirst("sub")!.Value)));

    /// <summary>عرض ملخص أداء المندوبين</summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
        => HandleResult(await _service.GetSummaryAsync());

    /// <summary>عرض بيانات مندوب بالمعرف</summary>
    /// <param name="id">معرف المندوب</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    /// <summary>إنشاء مندوب مبيعات جديد</summary>
    /// <param name="request">بيانات المندوب</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSalesRepRequest request)
        => HandleResult(await _service.CreateAsync(request));

    /// <summary>تحديث بيانات مندوب</summary>
    /// <param name="id">معرف المندوب</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSalesRepRequest request)
        => HandleResult(await _service.UpdateAsync(id, request));

    /// <summary>حذف مندوب</summary>
    /// <param name="id">معرف المندوب</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    // ─── Ledger ─────────────────────────────────────────────

    /// <summary>عرض دفتر حساب المندوب</summary>
    /// <param name="id">معرف المندوب</param>
    /// <param name="from">تاريخ البداية</param>
    /// <param name="to">تاريخ النهاية</param>
    [HttpGet("{id:int}/ledger")]
    [Authorize]
    public async Task<IActionResult> GetLedger(int id, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => HandleResult(await _service.GetLedgerAsync(id, from, to));

    // ─── Payment Collection ─────────────────────────────────

    /// <summary>تسجيل تحصيل دفعة من مندوب</summary>
    /// <param name="id">معرف المندوب</param>
    /// <param name="request">بيانات التحصيل</param>
    [HttpPost("{id:int}/collect-payment")]
    [Authorize]
    public async Task<IActionResult> CollectPayment(int id, [FromBody] CollectPaymentRequest request)
        => HandleResult(await _service.CollectPaymentAsync(id, request));

    // ─── Commission ─────────────────────────────────────────

    /// <summary>عرض عمولات المندوب</summary>
    /// <param name="id">معرف المندوب</param>
    [HttpGet("{id:int}/commissions")]
    public async Task<IActionResult> GetCommissions(int id)
        => HandleResult(await _service.GetCommissionsAsync(id));

    /// <summary>حساب عمولة المندوب لشهر محدد</summary>
    /// <param name="id">معرف المندوب</param>
    /// <param name="month">الشهر</param>
    /// <param name="year">السنة</param>
    [HttpPost("{id:int}/commissions/calculate")]
    public async Task<IActionResult> CalculateCommission(int id, [FromQuery] int month, [FromQuery] int year)
        => HandleResult(await _service.CalculateCommissionAsync(id, month, year));

    /// <summary>صرف عمولة</summary>
    /// <param name="commissionId">معرف العمولة</param>
    /// <param name="request">بيانات الصرف</param>
    [HttpPost("commissions/{commissionId:int}/pay")]
    public async Task<IActionResult> PayCommission(int commissionId, [FromBody] PayCommissionRequest request)
        => HandleResult(await _service.PayCommissionAsync(commissionId, request));

    // ─── Performance Report ─────────────────────────────────

    /// <summary>تقرير أداء المندوبين الشهري</summary>
    /// <param name="month">الشهر</param>
    /// <param name="year">السنة</param>
    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformance([FromQuery] int month, [FromQuery] int year)
        => HandleResult(await _service.GetPerformanceReportAsync(month, year));
}
