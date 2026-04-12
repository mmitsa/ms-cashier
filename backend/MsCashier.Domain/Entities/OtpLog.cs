using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// OTP Log
// ============================================================

public class OtpLog : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int OtpConfigId { get; set; }

    [Required, MaxLength(20)]
    public string Phone { get; set; } = default!;

    [Required, MaxLength(10)]
    public string Code { get; set; } = default!;

    public OtpPurpose Purpose { get; set; }

    public bool IsUsed { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int Attempts { get; set; }

    [MaxLength(500)]
    public string? GatewayMessageId { get; set; }

    // Navigation
    public OtpConfig? OtpConfig { get; set; }
}

// ============================================================
// Attendance Device (Fingerprint readers: ZKTeco, Hikvision etc.)
// ============================================================

