using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة الأقساط</summary>
[Route("api/v1/installments")]
public class InstallmentsController : BaseApiController
{
    private readonly IInstallmentService _installmentService;

    public InstallmentsController(IInstallmentService installmentService) => _installmentService = installmentService;

    /// <summary>إنشاء خطة أقساط جديدة</summary>
    /// <param name="request">بيانات خطة الأقساط</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInstallmentRequest request)
    {
        var result = await _installmentService.CreateAsync(request);
        return HandleResult(result);
    }

    /// <summary>عرض الأقساط النشطة</summary>
    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var result = await _installmentService.GetActiveAsync();
        return HandleResult(result);
    }

    /// <summary>تسجيل دفعة قسط</summary>
    /// <param name="id">معرف خطة الأقساط</param>
    /// <param name="paymentNumber">رقم الدفعة</param>
    /// <param name="dto">المبلغ</param>
    [HttpPost("{id:int}/pay/{paymentNumber:int}")]
    public async Task<IActionResult> Pay(int id, int paymentNumber, [FromBody] InstPayDto dto)
    {
        var result = await _installmentService.RecordPaymentAsync(id, paymentNumber, dto.Amount);
        return HandleResult(result);
    }

    /// <summary>عرض الأقساط المتأخرة</summary>
    [HttpGet("overdue")]
    public async Task<IActionResult> GetOverdue()
    {
        var result = await _installmentService.GetOverdueAsync();
        return HandleResult(result);
    }
}

// ============================================================
// DashboardController
// ============================================================
