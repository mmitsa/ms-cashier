using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة طلبات المطعم والمطبخ</summary>
[ApiController]
[Route("api/dine-orders")]
[Authorize]
public class DineOrdersController : BaseApiController
{
    private readonly IDineOrderService _service;
    public DineOrdersController(IDineOrderService service) => _service = service;

    /// <summary>إنشاء طلب مطعم جديد</summary>
    /// <param name="dto">بيانات الطلب</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDineOrderRequest dto) => HandleResult(await _service.CreateOrderAsync(dto));

    /// <summary>عرض طلب بالمعرف</summary>
    /// <param name="id">معرف الطلب</param>
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id) => HandleResult(await _service.GetByIdAsync(id));

    /// <summary>عرض الطلبات النشطة</summary>
    [HttpGet("active")]
    public async Task<IActionResult> Active() => HandleResult(await _service.GetActiveOrdersAsync());

    /// <summary>عرض طلبات طاولة محددة</summary>
    /// <param name="tableId">معرف الطاولة</param>
    [HttpGet("table/{tableId:int}")]
    public async Task<IActionResult> ByTable(int tableId) => HandleResult(await _service.GetOrdersByTableAsync(tableId));

    /// <summary>إضافة أصناف لطلب قائم</summary>
    /// <param name="id">معرف الطلب</param>
    /// <param name="dto">الأصناف المراد إضافتها</param>
    [HttpPost("{id:long}/add-items")]
    public async Task<IActionResult> AddItems(long id, [FromBody] AddItemsToOrderRequest dto) => HandleResult(await _service.AddItemsAsync(id, dto));

    /// <summary>إرسال الطلب للمطبخ</summary>
    /// <param name="id">معرف الطلب</param>
    [HttpPost("{id:long}/send-kitchen")]
    public async Task<IActionResult> SendToKitchen(long id) => HandleResult(await _service.SendToKitchenAsync(id));

    /// <summary>تحديد الطلب كمقدَّم</summary>
    /// <param name="id">معرف الطلب</param>
    [HttpPost("{id:long}/serve")]
    public async Task<IActionResult> MarkServed(long id) => HandleResult(await _service.MarkServedAsync(id));

    /// <summary>إلغاء طلب</summary>
    /// <param name="id">معرف الطلب</param>
    [HttpPost("{id:long}/cancel")]
    public async Task<IActionResult> Cancel(long id) => HandleResult(await _service.CancelOrderAsync(id));

    /// <summary>إصدار فاتورة للطلب</summary>
    /// <param name="id">معرف الطلب</param>
    /// <param name="dto">بيانات الفاتورة</param>
    [HttpPost("{id:long}/bill")]
    public async Task<IActionResult> Bill(long id, [FromBody] BillOrderRequest dto) => HandleResult(await _service.BillOrderAsync(id, dto));

    /// <summary>عرض لوحة المطبخ</summary>
    [HttpGet("kitchen")]
    public async Task<IActionResult> Kitchen() => HandleResult(await _service.GetKitchenBoardAsync());

    /// <summary>تحديث حالة صنف في المطبخ</summary>
    /// <param name="itemId">معرف الصنف</param>
    /// <param name="dto">الحالة الجديدة</param>
    [HttpPut("items/{itemId:long}/status")]
    public async Task<IActionResult> UpdateItemStatus(long itemId, [FromBody] UpdateOrderItemStatusRequest dto)
        => HandleResult(await _service.UpdateItemKitchenStatusAsync(itemId, dto));

    /// <summary>تحديد جميع أصناف الطلب كجاهزة</summary>
    /// <param name="id">معرف الطلب</param>
    [HttpPost("{id:long}/all-ready")]
    public async Task<IActionResult> AllReady(long id) => HandleResult(await _service.MarkAllItemsReadyAsync(id));

    /// <summary>عرض إحصائيات المطبخ</summary>
    [HttpGet("kitchen/stats")]
    public async Task<IActionResult> KitchenStats() => HandleResult(await _service.GetKitchenStatsAsync());

    /// <summary>عرض الطلبات المكتملة</summary>
    /// <param name="limit">الحد الأقصى للنتائج</param>
    [HttpGet("kitchen/completed")]
    public async Task<IActionResult> Completed([FromQuery] int limit = 20) => HandleResult(await _service.GetCompletedOrdersAsync(limit));

    /// <summary>استرجاع طلب للمطبخ</summary>
    /// <param name="id">معرف الطلب</param>
    [HttpPost("{id:long}/recall")]
    public async Task<IActionResult> Recall(long id) => HandleResult(await _service.RecallOrderAsync(id));
}

// ============================================================
// Floor Sections Controller
// ============================================================
