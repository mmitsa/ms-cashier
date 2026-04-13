using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>التكامل مع هيئة الزكاة والضريبة (ZATCA)</summary>
[Route("api/v1/zatca")]
public class ZatcaController : BaseApiController
{
    private readonly IZatcaService _zatcaService;

    public ZatcaController(IZatcaService zatcaService) => _zatcaService = zatcaService;

    /// <summary>الإبلاغ عن فاتورة لهيئة الزكاة</summary>
    /// <param name="invoiceId">معرف الفاتورة</param>
    [HttpPost("{invoiceId:long}/report")]
    public async Task<IActionResult> Report(long invoiceId)
    {
        var result = await _zatcaService.ReportInvoiceAsync(invoiceId);
        return HandleResult(result);
    }

    /// <summary>اعتماد فاتورة من هيئة الزكاة</summary>
    /// <param name="invoiceId">معرف الفاتورة</param>
    [HttpPost("{invoiceId:long}/clear")]
    public async Task<IActionResult> Clear(long invoiceId)
    {
        var result = await _zatcaService.ClearInvoiceAsync(invoiceId);
        return HandleResult(result);
    }

    /// <summary>توليد كود QR للفاتورة</summary>
    /// <param name="invoiceId">معرف الفاتورة</param>
    [HttpGet("{invoiceId:long}/qr")]
    public async Task<IActionResult> GetQrCode(long invoiceId)
    {
        var result = await _zatcaService.GenerateQrCodeAsync(invoiceId);
        return HandleResult(result);
    }

    /// <summary>توليد ملف XML للفاتورة</summary>
    /// <param name="invoiceId">معرف الفاتورة</param>
    [HttpGet("{invoiceId:long}/xml")]
    public async Task<IActionResult> GetXml(long invoiceId)
    {
        var result = await _zatcaService.GenerateInvoiceXmlAsync(invoiceId);
        return HandleResult(result);
    }
}

// ============================================================
// UsersController
// ============================================================
