using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.Services.Accounting.Posting;

namespace MsCashier.API.Controllers;

/// <summary>
/// Admin endpoint to settle a batch of card-swipe receipts (parked in 1120
/// Card Payments Clearing) against a bank account, net of processor fees.
/// </summary>
[ApiController]
[Route("api/v1/admin/accounting/card-settlement")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class CardSettlementController : BaseApiController
{
    private readonly ICardSettlementService _service;

    public CardSettlementController(ICardSettlementService service)
    {
        _service = service;
    }

    public record CardSettlementRequest(
        int BankAccountId,
        decimal Amount,
        DateTime SettlementDate,
        decimal FeesAmount,
        string? Reference);

    [HttpPost("")]
    public async Task<IActionResult> Settle([FromBody] CardSettlementRequest request, CancellationToken ct)
        => HandleResult(await _service.SettleClearingBatchAsync(
            request.BankAccountId,
            request.Amount,
            request.SettlementDate,
            request.FeesAmount,
            request.Reference,
            ct));
}
