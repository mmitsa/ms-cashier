using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public enum RfidScanStatus : byte { InProgress = 1, Completed = 2, Cancelled = 3 }

public class RfidScanSession : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int WarehouseId { get; set; }

    public Guid UserId { get; set; }

    [MaxLength(20)]
    public string SessionType { get; set; } = "full_count"; // full_count, partial_count, spot_check

    public RfidScanStatus Status { get; set; } = RfidScanStatus.InProgress;

    public int TotalTagsScanned { get; set; }

    public int MatchedItems { get; set; }

    public int UnmatchedTags { get; set; }

    public int MissingItems { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    // Navigation
    public Warehouse? Warehouse { get; set; }
    public ICollection<RfidScanResult> Results { get; set; } = new List<RfidScanResult>();
}
