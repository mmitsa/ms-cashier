using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة الفواتير</summary>
[Route("api/v1/invoices")]
public class InvoicesController : BaseApiController
{
    private readonly IInvoiceService _invoiceService;
    private readonly IPdfService _pdfService;

    public InvoicesController(IInvoiceService invoiceService, IPdfService pdfService)
    {
        _invoiceService = invoiceService;
        _pdfService = pdfService;
    }

    /// <summary>تحميل فاتورة بصيغة PDF</summary>
    /// <param name="id">معرف الفاتورة</param>
    [HttpGet("{id:long}/pdf")]
    public async Task<IActionResult> GetPdf(long id)
    {
        var result = await _pdfService.GenerateInvoicePdfAsync(id);
        if (!result.IsSuccess)
            return BadRequest(new { success = false, errors = result.Errors });
        return File(result.Data!, "application/pdf", $"invoice-{id}.pdf");
    }

    /// <summary>إنشاء فاتورة بيع</summary>
    /// <param name="request">بيانات الفاتورة</param>
    [HttpPost("sale")]
    public async Task<IActionResult> CreateSale([FromBody] CreateInvoiceRequest request)
    {
        var result = await _invoiceService.CreateSaleAsync(request);
        return HandleResult(result);
    }

    /// <summary>إنشاء فاتورة شراء</summary>
    /// <param name="request">بيانات الفاتورة</param>
    [HttpPost("purchase")]
    public async Task<IActionResult> CreatePurchase([FromBody] CreateInvoiceRequest request)
    {
        var result = await _invoiceService.CreatePurchaseAsync(request);
        return HandleResult(result);
    }

    /// <summary>إنشاء مرتجع لفاتورة</summary>
    /// <param name="id">معرف الفاتورة الأصلية</param>
    /// <param name="items">الأصناف المرتجعة</param>
    [HttpPost("{id:long}/return")]
    public async Task<IActionResult> CreateReturn(long id, [FromBody] List<InvoiceItemRequest> items)
    {
        var result = await _invoiceService.CreateSaleReturnAsync(id, items);
        return HandleResult(result);
    }

    /// <summary>البحث في الفواتير</summary>
    /// <param name="request">معايير البحث</param>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] InvoiceSearchRequest request)
    {
        var result = await _invoiceService.SearchAsync(request);
        return HandleResult(result);
    }

    /// <summary>عرض فاتورة بالمعرف</summary>
    /// <param name="id">معرف الفاتورة</param>
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var result = await _invoiceService.GetByIdAsync(id);
        return HandleResult(result);
    }
}

// ============================================================
// ContactsController
// ============================================================
