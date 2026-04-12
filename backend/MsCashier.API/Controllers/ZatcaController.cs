using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/zatca")]
public class ZatcaController : BaseApiController
{
    private readonly IZatcaService _zatcaService;

    public ZatcaController(IZatcaService zatcaService) => _zatcaService = zatcaService;

    [HttpPost("{invoiceId:long}/report")]
    public async Task<IActionResult> Report(long invoiceId)
    {
        var result = await _zatcaService.ReportInvoiceAsync(invoiceId);
        return HandleResult(result);
    }

    [HttpPost("{invoiceId:long}/clear")]
    public async Task<IActionResult> Clear(long invoiceId)
    {
        var result = await _zatcaService.ClearInvoiceAsync(invoiceId);
        return HandleResult(result);
    }

    [HttpGet("{invoiceId:long}/qr")]
    public async Task<IActionResult> GetQrCode(long invoiceId)
    {
        var result = await _zatcaService.GenerateQrCodeAsync(invoiceId);
        return HandleResult(result);
    }

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

