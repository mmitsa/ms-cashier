using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MsCashier.Application.Services.Accounting.Posting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>
/// Admin-only inspection + retry endpoints for posting failures captured by the
/// auto-posting hooks. Not module-gated: available to SuperAdmin/Admin regardless
/// of the tenant's Accounting module subscription (so ops can always clean up).
/// </summary>
[ApiController]
[Route("api/v1/admin/accounting/posting-failures")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class PostingFailuresController : BaseApiController
{
    private readonly IUnitOfWork _uow;
    private readonly ISalePostingService _salePosting;
    private readonly IPayrollPostingService _payrollPosting;
    private readonly IReceiptPostingService _receiptPosting;
    private readonly IPaymentPostingService _paymentPosting;
    private readonly IInstallmentPaymentPostingService _installmentPosting;

    public PostingFailuresController(
        IUnitOfWork uow,
        ISalePostingService salePosting,
        IPayrollPostingService payrollPosting,
        IReceiptPostingService receiptPosting,
        IPaymentPostingService paymentPosting,
        IInstallmentPaymentPostingService installmentPosting)
    {
        _uow = uow;
        _salePosting = salePosting;
        _payrollPosting = payrollPosting;
        _receiptPosting = receiptPosting;
        _paymentPosting = paymentPosting;
        _installmentPosting = installmentPosting;
    }

    // The journal engine returns this Arabic prefix when (SourceType,SourceId)
    // already has a posted JE. For a retry that's a "successful resolution" —
    // the original post succeeded on a prior attempt (or by another path), so
    // we close out the failure row rather than incrementing retry count.
    private const string DuplicateMarker = "يوجد قيد بالفعل";

    public record PostingFailureDto(
        long Id,
        string SourceType,
        long SourceId,
        string Operation,
        string ErrorMessage,
        int RetryCount,
        DateTime? LastRetryAt,
        bool IsResolved,
        DateTime? ResolvedAt,
        string? ResolutionNotes,
        DateTime CreatedAt);

    public record PagedResult<T>(int Total, int Page, int PageSize, List<T> Items);

    /// <summary>Paged list of posting failures. Filter by ?resolved=false&amp;source=Invoice.</summary>
    [HttpGet("")]
    public async Task<IActionResult> List(
        [FromQuery] bool? resolved,
        [FromQuery] string? source,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 500) pageSize = 50;

        var q = _uow.Repository<PostingFailure>().Query();
        if (resolved.HasValue) q = q.Where(f => f.IsResolved == resolved.Value);
        if (!string.IsNullOrWhiteSpace(source)) q = q.Where(f => f.SourceType == source);

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(f => f.IsResolved == false)
            .ThenByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new PostingFailureDto(
                f.Id, f.SourceType, f.SourceId, f.Operation, f.ErrorMessage,
                f.RetryCount, f.LastRetryAt, f.IsResolved, f.ResolvedAt,
                f.ResolutionNotes, f.CreatedAt))
            .ToListAsync(ct);

        return HandleResult(Result<PagedResult<PostingFailureDto>>.Success(new PagedResult<PostingFailureDto>(total, page, pageSize, items)));
    }

    /// <summary>Re-trigger the original posting by dispatching to the appropriate posting service based on SourceType.</summary>
    [HttpPost("{id:long}/retry")]
    public async Task<IActionResult> Retry(long id, CancellationToken ct = default)
    {
        var row = await _uow.Repository<PostingFailure>().Query().FirstOrDefaultAsync(f => f.Id == id, ct);
        if (row is null)
            return HandleResult(Result<object>.Failure("سجل فشل الترحيل غير موجود"));
        if (row.IsResolved)
            return HandleResult(Result<object>.Failure("هذا السجل تم حله بالفعل"));

        row.RetryCount++;
        row.LastRetryAt = DateTime.UtcNow;

        Result<long>? postResult = row.SourceType switch
        {
            "Invoice"             => await _salePosting.PostSaleAsync(row.SourceId, ct),
            "Payroll"             => await _payrollPosting.PostPayrollRunAsync((int)row.SourceId, ct),
            "FinanceTransaction"  => row.Operation switch
            {
                "Receipt" => await _receiptPosting.RepostFromFinanceTransactionAsync(row.SourceId, ct),
                "Payment" => await _paymentPosting.RepostFromFinanceTransactionAsync(row.SourceId, ct),
                _         => Result<long>.Failure("عملية غير معروفة لمعاملة مالية"),
            },
            "InstallmentPayment"  => await _installmentPosting.PostInstallmentPaymentAsync((int)row.SourceId, ct),
            _ => null,
        };

        if (postResult is null)
        {
            _uow.Repository<PostingFailure>().Update(row);
            await _uow.SaveChangesAsync(ct);
            return HandleResult(Result<object>.Failure(
                $"إعادة المحاولة غير مدعومة لهذا النوع «{row.SourceType}». استخدم /resolve بعد المعالجة اليدوية."));
        }

        // Duplicate-source rejection from the journal engine = the post already
        // happened (idempotency guard fired). Treat as a successful resolution:
        // undo the retry-count increment, mark resolved, capture the EntryNumber
        // the engine echoed back so the admin has a trail to the real JE.
        var combinedError = string.Join("; ", postResult.Errors);
        var isDuplicateResolution = !postResult.IsSuccess
            && combinedError.Contains(DuplicateMarker, StringComparison.Ordinal);

        if (postResult.IsSuccess)
        {
            row.IsResolved = true;
            row.ResolvedAt = DateTime.UtcNow;
            row.ResolutionNotes = Truncate($"Auto-resolved by retry. JournalEntryId={postResult.Data}", 500);
        }
        else if (isDuplicateResolution)
        {
            row.RetryCount--; // duplicate detection is not a real retry
            row.IsResolved = true;
            row.ResolvedAt = DateTime.UtcNow;
            row.ResolutionNotes = Truncate($"تم اكتشاف قيد موجود مسبقاً — {combinedError}", 500);
        }
        else
        {
            row.ErrorMessage = Truncate(combinedError, 2000);
        }

        _uow.Repository<PostingFailure>().Update(row);
        await _uow.SaveChangesAsync(ct);

        if (postResult.IsSuccess)
            return HandleResult(Result<object>.Success(new { row.Id, row.IsResolved, JournalEntryId = postResult.Data }, "تمت إعادة الترحيل بنجاح"));
        if (isDuplicateResolution)
            return HandleResult(Result<object>.Success(new { row.Id, row.IsResolved, row.ResolutionNotes }, "تم اكتشاف قيد موجود مسبقاً — تم وضع علامة «محلول»"));
        return HandleResult(Result<object>.Failure($"فشلت إعادة المحاولة: {row.ErrorMessage}"));
    }

    public record ResolveRequest(string? Notes);

    /// <summary>Mark a failure as resolved (e.g., admin fixed the underlying data manually).</summary>
    [HttpPost("{id:long}/resolve")]
    public async Task<IActionResult> Resolve(long id, [FromBody] ResolveRequest body, CancellationToken ct = default)
    {
        var row = await _uow.Repository<PostingFailure>().Query().FirstOrDefaultAsync(f => f.Id == id, ct);
        if (row is null)
            return HandleResult(Result<object>.Failure("سجل فشل الترحيل غير موجود"));

        row.IsResolved = true;
        row.ResolvedAt = DateTime.UtcNow;
        var notes = Truncate(body?.Notes, 500);
        row.ResolutionNotes = notes;
        _uow.Repository<PostingFailure>().Update(row);
        await _uow.SaveChangesAsync(ct);

        return HandleResult(Result<object>.Success(new { row.Id, row.IsResolved }, "تم وضع علامة «محلول»"));
    }

    private static string? Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return value.Length <= max ? value : value.Substring(0, max);
    }
}
