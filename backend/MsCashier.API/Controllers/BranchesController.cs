using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة الفروع</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class BranchesController : BaseApiController
{
    private readonly IBranchService _service;
    public BranchesController(IBranchService service) => _service = service;

    /// <summary>عرض جميع الفروع</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() => HandleResult(await _service.GetBranchesAsync());

    /// <summary>عرض فرع بالمعرف</summary>
    /// <param name="id">معرف الفرع</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetBranchByIdAsync(id));

    /// <summary>عرض ملخص الفروع</summary>
    [HttpGet("summary")]
    public async Task<IActionResult> Summary() => HandleResult(await _service.GetSummaryAsync());

    /// <summary>عرض معلومات خطة الفروع</summary>
    [HttpGet("plan-info")]
    public async Task<IActionResult> PlanInfo() => HandleResult(await _service.GetPlanInfoAsync());

    /// <summary>تحديث بيانات فرع</summary>
    /// <param name="id">معرف الفرع</param>
    /// <param name="dto">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBranchDto dto) => HandleResult(await _service.UpdateBranchAsync(id, dto));

    /// <summary>تعليق فرع</summary>
    /// <param name="id">معرف الفرع</param>
    [HttpPost("{id:int}/suspend")]
    public async Task<IActionResult> Suspend(int id) => HandleResult(await _service.SuspendBranchAsync(id));

    /// <summary>تفعيل فرع</summary>
    /// <param name="id">معرف الفرع</param>
    [HttpPost("{id:int}/activate")]
    public async Task<IActionResult> Activate(int id) => HandleResult(await _service.ActivateBranchAsync(id));

    /// <summary>ربط مستودع بفرع</summary>
    /// <param name="dto">بيانات الربط</param>
    [HttpPost("assign-warehouse")]
    public async Task<IActionResult> AssignWarehouse([FromBody] AssignWarehouseToBranchDto dto) => HandleResult(await _service.AssignWarehouseAsync(dto));

    /// <summary>إلغاء ربط مستودع من فرع</summary>
    /// <param name="warehouseId">معرف المستودع</param>
    [HttpPost("unassign-warehouse/{warehouseId:int}")]
    public async Task<IActionResult> UnassignWarehouse(int warehouseId) => HandleResult(await _service.UnassignWarehouseAsync(warehouseId));

    /// <summary>إنشاء طلب فرع جديد</summary>
    /// <param name="dto">بيانات الطلب</param>
    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateBranchRequestDto dto) => HandleResult(await _service.CreateBranchRequestAsync(dto));

    /// <summary>عرض طلبات الفروع الخاصة بي</summary>
    [HttpGet("requests/mine")]
    public async Task<IActionResult> MyRequests() => HandleResult(await _service.GetMyRequestsAsync());

    /// <summary>تسجيل دفعة لطلب فرع</summary>
    /// <param name="requestId">معرف الطلب</param>
    /// <param name="dto">بيانات الدفعة</param>
    [HttpPost("requests/{requestId:int}/pay")]
    public async Task<IActionResult> RecordPayment(int requestId, [FromBody] BranchPaymentDto dto) => HandleResult(await _service.RecordPaymentAsync(requestId, dto));
}

// ============================================================
// Branch Requests (Admin-side)
// ============================================================
