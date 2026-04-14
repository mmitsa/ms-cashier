using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة أجهزة الدفع (POS Terminals)</summary>
[Route("api/v1/payment-terminals")]
public class PaymentTerminalsController : BaseApiController
{
    private readonly IPaymentTerminalService _service;
    public PaymentTerminalsController(IPaymentTerminalService service) => _service = service;

    /// <summary>عرض جميع أجهزة الدفع</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() => HandleResult(await _service.GetAllAsync());

    /// <summary>عرض جهاز دفع بالمعرف</summary>
    /// <param name="id">معرف الجهاز</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => HandleResult(await _service.GetByIdAsync(id));

    /// <summary>إنشاء جهاز دفع جديد</summary>
    /// <param name="req">بيانات الجهاز</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveTerminalRequest req) => HandleResult(await _service.SaveAsync(null, req));

    /// <summary>تحديث بيانات جهاز دفع</summary>
    /// <param name="id">معرف الجهاز</param>
    /// <param name="req">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveTerminalRequest req) => HandleResult(await _service.SaveAsync(id, req));

    /// <summary>حذف جهاز دفع</summary>
    /// <param name="id">معرف الجهاز</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => HandleResult(await _service.DeleteAsync(id));

    /// <summary>تعيين جهاز كافتراضي</summary>
    /// <param name="id">معرف الجهاز</param>
    [HttpPost("{id:int}/set-default")]
    public async Task<IActionResult> SetDefault(int id) => HandleResult(await _service.SetDefaultAsync(id));

    /// <summary>اختبار اتصال الجهاز</summary>
    /// <param name="id">معرف الجهاز</param>
    [HttpPost("{id:int}/ping")]
    public async Task<IActionResult> Ping(int id) => HandleResult(await _service.PingTerminalAsync(id));

    /// <summary>بدء عملية دفع على الجهاز</summary>
    /// <param name="req">بيانات الدفع</param>
    [HttpPost("pay")]
    public async Task<IActionResult> InitiatePayment([FromBody] InitiateTerminalPaymentRequest req)
        => HandleResult(await _service.InitiatePaymentAsync(req));

    /// <summary>التحقق من حالة معاملة</summary>
    /// <param name="txnId">معرف المعاملة</param>
    [HttpGet("txn/{txnId:long}/status")]
    public async Task<IActionResult> CheckTxnStatus(long txnId)
        => HandleResult(await _service.CheckTransactionStatusAsync(txnId));

    /// <summary>إلغاء عملية دفع</summary>
    /// <param name="txnId">معرف المعاملة</param>
    [HttpPost("txn/{txnId:long}/cancel")]
    public async Task<IActionResult> CancelPayment(long txnId)
        => HandleResult(await _service.CancelPaymentAsync(txnId));

    /// <summary>استرجاع مبلغ عملية دفع</summary>
    /// <param name="txnId">معرف المعاملة</param>
    /// <param name="amount">المبلغ (اختياري، الافتراضي: المبلغ الكامل)</param>
    [HttpPost("txn/{txnId:long}/refund")]
    public async Task<IActionResult> RefundPayment(long txnId, [FromQuery] decimal? amount)
        => HandleResult(await _service.RefundPaymentAsync(txnId, amount));

    /// <summary>عرض سجل المعاملات</summary>
    /// <param name="terminalId">معرف الجهاز (اختياري)</param>
    /// <param name="from">تاريخ البداية</param>
    /// <param name="to">تاريخ النهاية</param>
    /// <param name="limit">الحد الأقصى للنتائج</param>
    [HttpGet("txn")]
    public async Task<IActionResult> GetTransactions([FromQuery] int? terminalId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int limit = 50)
        => HandleResult(await _service.GetTransactionsAsync(terminalId, from, to, limit));

    /// <summary>مطابقة الجهاز</summary>
    /// <param name="id">معرف الجهاز</param>
    [HttpPost("{id:int}/reconcile")]
    public async Task<IActionResult> Reconcile(int id)
        => HandleResult(await _service.ReconcileAsync(id));
}

// ============================================================
// RecipesController
// ============================================================
