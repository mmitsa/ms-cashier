using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>جرد المخزون والأرصدة الافتتاحية</summary>
[Route("api/v1/stock-counts")]
public class StockCountController : BaseApiController
{
    private readonly IStockCountService _service;

    public StockCountController(IStockCountService service) => _service = service;

    /// <summary>بدء جلسة جرد جديدة</summary>
    [HttpPost]
    public async Task<IActionResult> Start([FromBody] StartStockCountRequest request)
        => HandleResult(await _service.StartAsync(request));

    /// <summary>عرض جميع جلسات الجرد</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    /// <summary>عرض جلسة جرد واحدة</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
        => HandleResult(await _service.GetAsync(id));

    /// <summary>عرض أصناف جلسة الجرد</summary>
    [HttpGet("{id:int}/items")]
    public async Task<IActionResult> GetItems(int id)
        => HandleResult(await _service.GetItemsAsync(id));

    /// <summary>تسجيل سكان/عد لصنف (كل استدعاء يزيد العدد)</summary>
    [HttpPost("{id:int}/scan")]
    public async Task<IActionResult> Scan(int id, [FromBody] ScanProductRequest request)
        => HandleResult(await _service.ScanProductAsync(id, request));

    /// <summary>تعديل الكمية المعدودة يدوياً</summary>
    [HttpPut("{id:int}/items/{itemId:long}/count")]
    public async Task<IActionResult> SetCount(int id, long itemId, [FromBody] SetCountedQtyRequest request)
        => HandleResult(await _service.SetCountedQtyAsync(id, itemId, request));

    /// <summary>تسوية صنف (مطابقة الرصيد الفعلي مع المخزون)</summary>
    [HttpPost("{id:int}/items/{itemId:long}/settle")]
    public async Task<IActionResult> Settle(int id, long itemId, [FromBody] SettleItemRequest request)
        => HandleResult(await _service.SettleItemAsync(id, itemId, request));

    /// <summary>إكمال جلسة الجرد</summary>
    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id)
        => HandleResult(await _service.CompleteAsync(id));

    /// <summary>إلغاء جلسة الجرد</summary>
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
        => HandleResult(await _service.CancelAsync(id));

    /// <summary>إدخال أرصدة افتتاحية مجمّعة</summary>
    [HttpPost("opening-balances")]
    public async Task<IActionResult> OpeningBalances([FromBody] BulkOpeningBalanceRequest request)
        => HandleResult(await _service.BulkSetOpeningBalancesAsync(request));
}
