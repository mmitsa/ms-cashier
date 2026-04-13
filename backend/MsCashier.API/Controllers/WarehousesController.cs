using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة المستودعات</summary>
[Route("api/v1/warehouses")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class WarehousesController : BaseApiController
{
    private readonly IWarehouseService _warehouseService;

    public WarehousesController(IWarehouseService warehouseService) => _warehouseService = warehouseService;

    /// <summary>إنشاء مستودع جديد</summary>
    /// <param name="request">بيانات المستودع</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseRequest request)
    {
        var result = await _warehouseService.CreateAsync(request.Name, request.Location, request.IsMain);
        return HandleResult(result);
    }

    /// <summary>عرض جميع المستودعات</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _warehouseService.GetAllAsync();
        return HandleResult(result);
    }

    /// <summary>تحويل مخزون بين المستودعات</summary>
    /// <param name="request">بيانات التحويل</param>
    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] StockTransferRequest request)
    {
        var result = await _warehouseService.TransferStockAsync(request);
        return HandleResult(result);
    }
}

// ============================================================
// InventoryController
// ============================================================
