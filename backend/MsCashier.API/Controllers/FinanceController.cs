using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/finance")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class FinanceController : BaseApiController
{
    private readonly IFinanceService _financeService;

    public FinanceController(IFinanceService financeService) => _financeService = financeService;

    [HttpGet("accounts")]
    public async Task<IActionResult> GetAccounts()
    {
        var result = await _financeService.GetAccountsAsync();
        return HandleResult(result);
    }

    [HttpPost("accounts")]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request)
    {
        var result = await _financeService.CreateAccountAsync(request.Name, request.AccountType);
        return HandleResult(result);
    }

    [HttpPost("transactions")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request)
    {
        var result = await _financeService.RecordTransactionAsync(request);
        return HandleResult(result);
    }

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

