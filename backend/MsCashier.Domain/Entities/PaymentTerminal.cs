using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Payment Terminal (POS Machines — Saudi Market)
// ============================================================

public class PaymentTerminal : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    public TerminalProvider Provider { get; set; }
    public TerminalStatus Status { get; set; } = TerminalStatus.Active;

    [MaxLength(100)]
    public string? TerminalId { get; set; } // Provider's terminal ID (TID)

    [MaxLength(100)]
    public string? MerchantId { get; set; } // Provider's merchant ID (MID)

    [MaxLength(100)]
    public string? SerialNumber { get; set; }

    [MaxLength(500)]
    public string? ApiKey { get; set; }

    [MaxLength(500)]
    public string? ApiSecret { get; set; }

    [MaxLength(500)]
    public string? ApiBaseUrl { get; set; }

    public int? BranchId { get; set; }

    [MaxLength(100)]
    public string? IpAddress { get; set; }

    public int? Port { get; set; }

    public bool IsDefault { get; set; } = false;
    public bool SupportsRefund { get; set; } = true;
    public bool SupportsPreAuth { get; set; } = false;
    public bool SupportsContactless { get; set; } = true;

    [MaxLength(10)]
    public string Currency { get; set; } = "SAR";

    public DateTime? LastPingAt { get; set; }
    public DateTime? LastReconciliationAt { get; set; }

    // Navigation
    public Branch? Branch { get; set; }
    public ICollection<TerminalTransaction> Transactions { get; set; } = new List<TerminalTransaction>();
}

