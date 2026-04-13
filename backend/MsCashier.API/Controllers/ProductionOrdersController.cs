using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة أوامر الإنتاج</summary>
[Route("api/v1/production-orders")]
public class ProductionOrdersController : BaseApiController
{
    private readonly IProductionOrderService _productionService;
    public ProductionOrdersController(IProductionOrderService productionService) => _productionService = productionService;

    /// <summary>إنشاء أمر إنتاج جديد</summary>
    /// <param name="request">بيانات أمر الإنتاج</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductionOrderRequest request)
        => HandleResult(await _productionService.CreateAsync(request));

    /// <summary>عرض أمر إنتاج بالمعرف</summary>
    /// <param name="id">معرف أمر الإنتاج</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _productionService.GetByIdAsync(id));

    /// <summary>البحث في أوامر الإنتاج</summary>
    /// <param name="request">معايير التصفية</param>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] ProductionOrderFilterRequest request)
        => HandleResult(await _productionService.SearchAsync(request));

    /// <summary>تحديث أمر إنتاج</summary>
    /// <param name="id">معرف أمر الإنتاج</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductionOrderRequest request)
        => HandleResult(await _productionService.UpdateAsync(id, request));

    /// <summary>حذف أمر إنتاج</summary>
    /// <param name="id">معرف أمر الإنتاج</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _productionService.DeleteAsync(id));

    /// <summary>اعتماد أمر إنتاج</summary>
    /// <param name="id">معرف أمر الإنتاج</param>
    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
        => HandleResult(await _productionService.ApproveAsync(id));

    /// <summary>بدء تنفيذ أمر الإنتاج</summary>
    /// <param name="id">معرف أمر الإنتاج</param>
    [HttpPost("{id:int}/start")]
    public async Task<IActionResult> Start(int id)
        => HandleResult(await _productionService.StartAsync(id));

    /// <summary>إكمال أمر الإنتاج</summary>
    /// <param name="id">معرف أمر الإنتاج</param>
    /// <param name="request">بيانات الإكمال</param>
    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id, [FromBody] CompleteProductionRequest request)
        => HandleResult(await _productionService.CompleteAsync(id, request));

    /// <summary>إلغاء أمر الإنتاج</summary>
    /// <param name="id">معرف أمر الإنتاج</param>
    /// <param name="reason">سبب الإلغاء</param>
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] string? reason)
        => HandleResult(await _productionService.CancelAsync(id, reason));
}

// ============================================================
// ProductionWasteController
// ============================================================
