using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.Interfaces.Accounting;

namespace MsCashier.API.Controllers;

/// <summary>تقارير محاسبية للقراءة فقط (ميزان المراجعة، قائمة الدخل، الميزانية العمومية، كشوف الحسابات).</summary>
[Route("api/v1/accounting/reports")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AccountingReportsController : BaseApiController
{
    private readonly IAccountingReportsService _reports;

    public AccountingReportsController(IAccountingReportsService reports) => _reports = reports;

    /// <summary>ميزان المراجعة عن فترة.</summary>
    [HttpGet("trial-balance")]
    public async Task<IActionResult> GetTrialBalance(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] int? branchId,
        CancellationToken ct)
    {
        var result = await _reports.GetTrialBalanceAsync(fromDate, toDate, branchId, ct);
        return HandleResult(result);
    }

    /// <summary>قائمة الدخل عن فترة.</summary>
    [HttpGet("income-statement")]
    public async Task<IActionResult> GetIncomeStatement(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] int? branchId,
        CancellationToken ct)
    {
        var result = await _reports.GetIncomeStatementAsync(fromDate, toDate, branchId, ct);
        return HandleResult(result);
    }

    /// <summary>الميزانية العمومية حتى تاريخ.</summary>
    [HttpGet("balance-sheet")]
    public async Task<IActionResult> GetBalanceSheet(
        [FromQuery] DateTime asOfDate,
        [FromQuery] int? branchId,
        CancellationToken ct)
    {
        var result = await _reports.GetBalanceSheetAsync(asOfDate, branchId, ct);
        return HandleResult(result);
    }

    /// <summary>كشف حساب جهة اتصال (عميل/مورد) عن فترة.</summary>
    [HttpGet("contacts/{contactId:int}/statement")]
    public async Task<IActionResult> GetContactStatement(
        int contactId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        CancellationToken ct)
    {
        var result = await _reports.GetContactStatementAsync(contactId, fromDate, toDate, ct);
        return HandleResult(result);
    }
}
