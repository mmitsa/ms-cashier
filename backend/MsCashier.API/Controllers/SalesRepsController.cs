using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;

namespace MsCashier.API.Controllers;

[Route("api/v1/sales-reps")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SalesRepsController : BaseApiController
{
    private readonly ISalesRepService _service;

    public SalesRepsController(ISalesRepService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    /// <summary>Returns the SalesRep linked to the currently authenticated user (for SalesRep role).</summary>
    [HttpGet("mine")]
    [Authorize] // any authenticated user, but only SalesRep will find a match
    public async Task<IActionResult> GetMine()
        => HandleResult(await _service.GetByUserIdAsync(Guid.Parse(User.FindFirst("sub")!.Value)));

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
        => HandleResult(await _service.GetSummaryAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSalesRepRequest request)
        => HandleResult(await _service.CreateAsync(request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSalesRepRequest request)
        => HandleResult(await _service.UpdateAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    // ─── Ledger ─────────────────────────────────────────────

    [HttpGet("{id:int}/ledger")]
    [Authorize] // SalesRep can see their own ledger too
    public async Task<IActionResult> GetLedger(int id, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => HandleResult(await _service.GetLedgerAsync(id, from, to));

    // ─── Payment Collection ─────────────────────────────────

    [HttpPost("{id:int}/collect-payment")]
    [Authorize] // SalesRep can collect payments
    public async Task<IActionResult> CollectPayment(int id, [FromBody] CollectPaymentRequest request)
        => HandleResult(await _service.CollectPaymentAsync(id, request));

    // ─── Commission ─────────────────────────────────────────

    [HttpGet("{id:int}/commissions")]
    public async Task<IActionResult> GetCommissions(int id)
        => HandleResult(await _service.GetCommissionsAsync(id));

    [HttpPost("{id:int}/commissions/calculate")]
    public async Task<IActionResult> CalculateCommission(int id, [FromQuery] int month, [FromQuery] int year)
        => HandleResult(await _service.CalculateCommissionAsync(id, month, year));

    [HttpPost("commissions/{commissionId:int}/pay")]
    public async Task<IActionResult> PayCommission(int commissionId, [FromBody] PayCommissionRequest request)
        => HandleResult(await _service.PayCommissionAsync(commissionId, request));

    // ─── Performance Report ─────────────────────────────────

    [HttpGet("performance")]
    public async Task<IActionResult> GetPerformance([FromQuery] int month, [FromQuery] int year)
        => HandleResult(await _service.GetPerformanceReportAsync(month, year));
}
