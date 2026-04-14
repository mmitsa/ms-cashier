using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities.Accounting;

/// <summary>
/// Audit log row for a posting hook that threw. Lets admins inspect the failure
/// and retry it from the admin dashboard without digging through logs.
/// </summary>
public class PostingFailure : TenantEntity
{
    public long Id { get; set; }

    /// <summary>"Invoice", "Payroll", "InstallmentPayment", "FinanceTransaction", etc.</summary>
    [MaxLength(50)]
    public string SourceType { get; set; } = default!;

    public long SourceId { get; set; }

    /// <summary>"Sale", "SaleReturn", "Receipt", "Payment", "PayrollRun", etc.</summary>
    [MaxLength(50)]
    public string Operation { get; set; } = default!;

    [MaxLength(2000)]
    public string ErrorMessage { get; set; } = default!;

    [MaxLength(4000)]
    public string? StackTrace { get; set; }

    public int RetryCount { get; set; }

    public DateTime? LastRetryAt { get; set; }

    public bool IsResolved { get; set; }

    public DateTime? ResolvedAt { get; set; }

    [MaxLength(500)]
    public string? ResolutionNotes { get; set; }
}
