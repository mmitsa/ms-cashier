using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة الحسابات المالية والمعاملات</summary>
[Route("api/v1/finance")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class FinanceController : BaseApiController
{
    private readonly IFinanceService _financeService;

    public FinanceController(IFinanceService financeService) => _financeService = financeService;

    /// <summary>عرض جميع الحسابات المالية</summary>
    [HttpGet("accounts")]
    public async Task<IActionResult> GetAccounts()
    {
        var result = await _financeService.GetAccountsAsync();
        return HandleResult(result);
    }

    /// <summary>إنشاء حساب مالي جديد</summary>
    /// <param name="request">بيانات الحساب</param>
    [HttpPost("accounts")]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request)
    {
        var result = await _financeService.CreateAccountAsync(request.Name, request.AccountType);
        return HandleResult(result);
    }

    /// <summary>تسجيل معاملة مالية</summary>
    /// <param name="request">بيانات المعاملة</param>
    [HttpPost("transactions")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request)
    {
        var result = await _financeService.RecordTransactionAsync(request);
        return HandleResult(result);
    }

    /// <summary>عرض المعاملات المالية مع التصفية</summary>
    /// <param name="accountId">معرف الحساب (اختياري)</param>
    /// <param name="from">تاريخ البداية</param>
    /// <param name="to">تاريخ النهاية</param>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] int? accountId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _financeService.GetTransactionsAsync(accountId, from, to, page, pageSize);
        return HandleResult(result);
    }

    /// <summary>عرض إجمالي الرصيد لجميع الحسابات</summary>
    [HttpGet("total-balance")]
    public async Task<IActionResult> GetTotalBalance()
    {
        var result = await _financeService.GetTotalBalanceAsync();
        return HandleResult(result);
    }
}

// ============================================================
// EmployeesController
// ============================================================
