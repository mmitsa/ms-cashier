using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة طاولات المطعم</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TablesController : BaseApiController
{
    private readonly ITableService _service;
    public TablesController(ITableService service) => _service = service;

    /// <summary>عرض جميع الطاولات</summary>
    /// <param name="branchId">معرف الفرع (اختياري)</param>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId) => HandleResult(await _service.GetTablesAsync(branchId));

    /// <summary>عرض طاولة بالمعرف</summary>
    /// <param name="id">معرف الطاولة</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetByIdAsync(id));

    /// <summary>إنشاء طاولة جديدة</summary>
    /// <param name="dto">بيانات الطاولة</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveTableRequest dto) => HandleResult(await _service.SaveAsync(null, dto));

    /// <summary>تحديث بيانات طاولة</summary>
    /// <param name="id">معرف الطاولة</param>
    /// <param name="dto">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveTableRequest dto) => HandleResult(await _service.SaveAsync(id, dto));

    /// <summary>حذف طاولة</summary>
    /// <param name="id">معرف الطاولة</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));

    /// <summary>تحديث حالة طاولة</summary>
    /// <param name="id">معرف الطاولة</param>
    /// <param name="dto">الحالة الجديدة</param>
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTableStatusRequest dto)
        => HandleResult(await _service.UpdateStatusAsync(id, dto));
}

// ============================================================
// Dine / Waiter Orders
// ============================================================
