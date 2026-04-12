using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/[controller]")]
public class PaymentTerminalsController : BaseApiController
{
    private readonly IPaymentTerminalService _service;
    public PaymentTerminalsController(IPaymentTerminalService service) => _service = service;

    // Terminal CRUD
    [HttpGet]
    public async Task<IActionResult> GetAll() => HandleResult(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveTerminalRequest req) => HandleResult(await _service.SaveAsync(null, req));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveTerminalRequest req) => HandleResult(await _service.SaveAsync(id, req));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));

    [HttpPost("{id:int}/set-default")]
    public async Task<IActionResult> SetDefault(int id) => HandleResult(await _service.SetDefaultAsync(id));

    [HttpPost("{id:int}/ping")]
    public async Task<IActionResult> Ping(int id) => HandleResult(await _service.PingTerminalAsync(id));

    // Payment Operations
    [HttpPost("pay")]
    public async Task<IActionResult> InitiatePayment([FromBody] InitiateTerminalPaymentRequest req)
        => HandleResult(await _service.InitiatePaymentAsync(req));

    [HttpGet("txn/{txnId:long}/status")]
    public async Task<IActionResult> CheckTxnStatus(long txnId)
        => HandleResult(await _service.CheckTransactionStatusAsync(txnId));

    [HttpPost("txn/{txnId:long}/cancel")]
    public async Task<IActionResult> CancelPayment(long txnId)
        => HandleResult(await _service.CancelPaymentAsync(txnId));

    [HttpPost("txn/{txnId:long}/refund")]
    public async Task<IActionResult> RefundPayment(long txnId, [FromQuery] decimal? amount)
        => HandleResult(await _service.RefundPaymentAsync(txnId, amount));

    // History & Reconciliation
    [HttpGet("txn")]
    public async Task<IActionResult> GetTransactions([FromQuery] int? terminalId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int limit = 50)
        => HandleResult(await _service.GetTransactionsAsync(terminalId, from, to, limit));

    [HttpPost("{id:int}/reconcile")]
    public async Task<IActionResult> Reconcile(int id)
        => HandleResult(await _service.ReconcileAsync(id));
}

// ============================================================
// RecipesController
// ============================================================

