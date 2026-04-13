using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة المخزون</summary>
[Route("api/v1/inventory")]
public class InventoryController : BaseApiController
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService) => _inventoryService = inventoryService;

    /// <summary>عرض مخزون مستودع محدد</summary>
    /// <param name="warehouseId">معرف المستودع</param>
    /// <param name="search">نص البحث</param>
    [HttpGet("{warehouseId:int}")]
    public async Task<IActionResult> GetInventory(int warehouseId, [FromQuery] string? search)
    {
        var result = await _inventoryService.GetInventoryAsync(warehouseId, search);
        return HandleResult(result);
    }

    /// <summary>تعديل كمية المخزون يدوياً</summary>
    /// <param name="dto">بيانات التعديل</param>
    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] AdjustStockDto dto)
    {
        var result = await _inventoryService.AdjustStockAsync(dto.ProductId, dto.WarehouseId, dto.NewQuantity, dto.Notes);
        return HandleResult(result);
    }

    /// <summary>عرض حركات مخزون منتج</summary>
    /// <param name="productId">معرف المنتج</param>
    /// <param name="from">تاريخ البداية</param>
    /// <param name="to">تاريخ النهاية</param>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
    [HttpGet("{productId:int}/movements")]
    public async Task<IActionResult> GetMovements(
        int productId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _inventoryService.GetMovementsAsync(productId, from, to, page, pageSize);
        return HandleResult(result);
    }

    /// <summary>عرض مخزون منتج حسب المستودعات</summary>
    /// <param name="productId">معرف المنتج</param>
    [HttpGet("product/{productId:int}/stock")]
    public async Task<IActionResult> GetProductStock(int productId)
        => HandleResult(await _inventoryService.GetProductStockByWarehouseAsync(productId));

    /// <summary>لوحة معلومات المخزون</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
        => HandleResult(await _inventoryService.GetDashboardAsync());
}

// ============================================================
// FinanceController
// ============================================================
