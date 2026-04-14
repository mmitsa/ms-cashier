namespace MsCashier.Application.Interfaces;

/// <summary>
/// Writes a row to the <c>PostingFailures</c> audit table when an auto-posting
/// hook throws. Implementations must be best-effort: swallow any exception that
/// happens during logging so we never fail the caller's original operation just
/// because the audit write failed.
/// </summary>
public interface IPostingFailureLogger
{
    Task LogAsync(string sourceType, long sourceId, string operation, Exception ex, CancellationToken ct = default);
    Task LogAsync(string sourceType, long sourceId, string operation, string errorMessage, CancellationToken ct = default);
}
