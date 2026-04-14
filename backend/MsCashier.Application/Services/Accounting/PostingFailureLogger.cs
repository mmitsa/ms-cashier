using Microsoft.Extensions.Logging;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting;

/// <summary>
/// Best-effort audit writer for posting hook failures. Any exception raised
/// while writing the audit row is caught and logged — never rethrown — because
/// the caller is already inside an exception handler around its own posting
/// call and must not fail its user-facing operation over a logging hiccup.
/// </summary>
public class PostingFailureLogger : IPostingFailureLogger
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly ILogger<PostingFailureLogger> _logger;

    public PostingFailureLogger(IUnitOfWork uow, ICurrentTenantService tenant, ILogger<PostingFailureLogger> logger)
    {
        _uow = uow;
        _tenant = tenant;
        _logger = logger;
    }

    public Task LogAsync(string sourceType, long sourceId, string operation, Exception ex, CancellationToken ct = default)
    {
        var message = Truncate(ex.Message, 2000);
        var stack = Truncate(ex.ToString(), 4000);
        return LogInternalAsync(sourceType, sourceId, operation, message, stack, ct);
    }

    public Task LogAsync(string sourceType, long sourceId, string operation, string errorMessage, CancellationToken ct = default)
        => LogInternalAsync(sourceType, sourceId, operation, Truncate(errorMessage, 2000), null, ct);

    private async Task LogInternalAsync(string sourceType, long sourceId, string operation, string errorMessage, string? stackTrace, CancellationToken ct)
    {
        try
        {
            var row = new PostingFailure
            {
                TenantId = _tenant.TenantId,
                SourceType = sourceType,
                SourceId = sourceId,
                Operation = operation,
                ErrorMessage = errorMessage,
                StackTrace = stackTrace,
                RetryCount = 0,
                IsResolved = false,
            };
            await _uow.Repository<PostingFailure>().AddAsync(row);
            await _uow.SaveChangesAsync(ct);
        }
        catch (Exception loggingEx)
        {
            // Never propagate — the caller is already in a catch block.
            try
            {
                _logger.LogError(loggingEx,
                    "Failed to persist PostingFailure row (source={SourceType}/{SourceId}, op={Operation}): {Message}",
                    sourceType, sourceId, operation, errorMessage);
            }
            catch { /* swallow — absolute last resort */ }
        }
    }

    private static string Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        return value.Length <= max ? value : value.Substring(0, max);
    }
}
