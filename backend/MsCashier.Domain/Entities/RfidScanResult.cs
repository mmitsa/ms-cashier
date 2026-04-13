using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public enum RfidScanResultType : byte { Matched = 1, Misplaced = 2, Unknown = 3, Missing = 4 }

public class RfidScanResult : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public long ScanSessionId { get; set; }

    [Required, MaxLength(100)]
    public string RfidTagId { get; set; } = default!;

    public int? ProductId { get; set; }

    [MaxLength(50)]
    public string? ScannedLocation { get; set; }

    [MaxLength(50)]
    public string? ExpectedLocation { get; set; }

    public RfidScanResultType ResultType { get; set; }

    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public RfidScanSession? ScanSession { get; set; }
    public Product? Product { get; set; }
}
