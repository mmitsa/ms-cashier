using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;

namespace MsCashier.API.Controllers;

/// <summary>
/// Admin-only endpoint that imports per-contact opening balances during
/// customer migration from another POS/ERP. One journal entry per contact,
/// idempotent on (SourceType="OpeningBalance", SourceId=ContactId).
/// </summary>
[ApiController]
[Route("api/v1/admin/accounting/opening-balances")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class OpeningBalancesController : BaseApiController
{
    private readonly IOpeningBalanceImportService _service;

    public OpeningBalancesController(IOpeningBalanceImportService service)
    {
        _service = service;
    }

    /// <summary>Import opening balances for a batch of contacts.</summary>
    [HttpPost("")]
    public async Task<IActionResult> Import(
        [FromBody] ImportOpeningBalancesRequest request,
        CancellationToken ct)
        => HandleResult(await _service.ImportAsync(request, ct));
}
