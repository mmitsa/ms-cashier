using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>
/// Admin-only, one-shot backfill endpoint for the GL accounting layer.
/// Seeds the default Chart of Accounts + a current-month AccountingPeriod for
/// every tenant that has zero CoA rows.
/// </summary>
[ApiController]
[Route("api/v1/admin/accounting/backfill")]
[Authorize(Roles = "SuperAdmin")]
public class AccountingBackfillController : BaseApiController
{
    private readonly IAccountingBackfillService _service;

    public AccountingBackfillController(IAccountingBackfillService service)
    {
        _service = service;
    }

    /// <summary>Run the backfill for every tenant with no CoA rows.</summary>
    [HttpPost("")]
    public async Task<IActionResult> BackfillAll(CancellationToken ct)
        => HandleResult(await _service.BackfillAllMissingAsync(ct));
}
