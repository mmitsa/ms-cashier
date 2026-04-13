using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة محطات المطبخ</summary>
[Route("api/v1/kitchen-stations")]
public class KitchenStationsController : BaseApiController
{
    private readonly IKitchenStationService _stationService;
    public KitchenStationsController(IKitchenStationService stationService) => _stationService = stationService;

    /// <summary>عرض جميع محطات المطبخ</summary>
    /// <param name="branchId">معرف الفرع (اختياري)</param>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId)
        => HandleResult(await _stationService.GetAllAsync(branchId));

    /// <summary>عرض محطة بالمعرف</summary>
    /// <param name="id">معرف المحطة</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _stationService.GetByIdAsync(id));

    /// <summary>إنشاء محطة مطبخ جديدة</summary>
    /// <param name="request">بيانات المحطة</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveKitchenStationRequest request)
        => HandleResult(await _stationService.SaveAsync(null, request));

    /// <summary>تحديث محطة مطبخ</summary>
    /// <param name="id">معرف المحطة</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveKitchenStationRequest request)
        => HandleResult(await _stationService.SaveAsync(id, request));

    /// <summary>حذف محطة مطبخ</summary>
    /// <param name="id">معرف المحطة</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _stationService.DeleteAsync(id));

    /// <summary>تعيين منتج لمحطة مطبخ</summary>
    /// <param name="request">بيانات التعيين</param>
    [HttpPost("assign-product")]
    public async Task<IActionResult> AssignProduct([FromBody] AssignProductToStationRequest request)
        => HandleResult(await _stationService.AssignProductAsync(request));

    /// <summary>إزالة منتج من محطة المطبخ</summary>
    /// <param name="productId">معرف المنتج</param>
    [HttpDelete("remove-product/{productId:int}")]
    public async Task<IActionResult> RemoveProduct(int productId)
        => HandleResult(await _stationService.RemoveProductAsync(productId));

    /// <summary>عرض تعيينات المنتجات للمحطات</summary>
    /// <param name="stationId">معرف المحطة (اختياري)</param>
    [HttpGet("product-assignments")]
    public async Task<IActionResult> GetAssignments([FromQuery] int? stationId)
        => HandleResult(await _stationService.GetProductAssignmentsAsync(stationId));
}

// ============================================================
// ProductionOrdersController
// ============================================================
