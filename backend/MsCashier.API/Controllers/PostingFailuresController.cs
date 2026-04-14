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

    public PostingFailuresController(
        IUnitOfWork uow,
        ISalePostingService salePosting,
        IPayrollPostingService payrollPosting)
    {
        _uow = uow;
        _salePosting = salePosting;
        _payrollPosting = payrollPosting;
    }

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
            // FinanceTransaction and InstallmentPayment don't expose a single "re-post by id"
            // service call today — those must be resolved manually via /resolve until their
            // posting services gain an idempotent re-post entry point.
            _ => null,
        };

        if (postResult is null)
        {
            _uow.Repository<PostingFailure>().Update(row);
            await _uow.SaveChangesAsync(ct);
            return HandleResult(Result<object>.Failure(
                $"إعادة المحاولة غير مدعومة لهذا النوع «{row.SourceType}». استخدم /resolve بعد المعالجة اليدوية."));
        }

        if (postResult.IsSuccess)
        {
            row.IsResolved = true;
            row.ResolvedAt = DateTime.UtcNow;
            row.ResolutionNotes = $"Auto-resolved by retry. JournalEntryId={postResult.Data}";
        }
        else
        {
            row.ErrorMessage = Truncate(string.Join("; ", postResult.Errors), 2000);
        }

        _uow.Repository<PostingFailure>().Update(row);
        await _uow.SaveChangesAsync(ct);

        return postResult.IsSuccess
            ? HandleResult(Result<object>.Success(new { row.Id, row.IsResolved, JournalEntryId = postResult.Data }, "تمت إعادة الترحيل بنجاح"))
            : HandleResult(Result<object>.Failure($"فشلت إعادة المحاولة: {row.ErrorMessage}"));
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
