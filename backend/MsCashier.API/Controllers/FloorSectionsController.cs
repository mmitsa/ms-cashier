using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة أقسام الطوابق والصالات</summary>
[Route("api/[controller]")]
public class FloorSectionsController : BaseApiController
{
    private readonly IFloorSectionService _service;
    public FloorSectionsController(IFloorSectionService service) => _service = service;

    /// <summary>عرض نظرة عامة على الطوابق</summary>
    /// <param name="branchId">معرف الفرع (اختياري)</param>
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview([FromQuery] int? branchId)
        => HandleResult(await _service.GetFloorOverviewAsync(branchId));

    /// <summary>عرض جميع الأقسام</summary>
    /// <param name="branchId">معرف الفرع (اختياري)</param>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId)
        => HandleResult(await _service.GetSectionsAsync(branchId));

    /// <summary>عرض قسم بالمعرف</summary>
    /// <param name="id">معرف القسم</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    /// <summary>إنشاء قسم جديد</summary>
    /// <param name="request">بيانات القسم</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveFloorSectionRequest request)
        => HandleResult(await _service.SaveAsync(null, request));

    /// <summary>تحديث قسم</summary>
    /// <param name="id">معرف القسم</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveFloorSectionRequest request)
        => HandleResult(await _service.SaveAsync(id, request));

    /// <summary>حذف قسم</summary>
    /// <param name="id">معرف القسم</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    /// <summary>إعادة ترتيب الأقسام</summary>
    /// <param name="sectionIds">قائمة معرفات الأقسام بالترتيب الجديد</param>
    [HttpPost("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<int> sectionIds)
        => HandleResult(await _service.ReorderAsync(sectionIds));

    /// <summary>تعيين طاولة لقسم</summary>
    /// <param name="sectionId">معرف القسم</param>
    /// <param name="tableId">معرف الطاولة</param>
    [HttpPost("{sectionId:int}/tables/{tableId:int}")]
    public async Task<IActionResult> AssignTable(int sectionId, int tableId)
        => HandleResult(await _service.AssignTableToSectionAsync(tableId, sectionId));

    /// <summary>إزالة طاولة من قسم</summary>
    /// <param name="sectionId">معرف القسم</param>
    /// <param name="tableId">معرف الطاولة</param>
    [HttpDelete("{sectionId:int}/tables/{tableId:int}")]
    public async Task<IActionResult> RemoveTable(int sectionId, int tableId)
        => HandleResult(await _service.RemoveTableFromSectionAsync(tableId));
}

// ============================================================
// QR Config Controller (store owner — authenticated)
// ============================================================
