using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// OTP Configuration (per tenant)
// ============================================================

public class OtpConfig : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public OtpProvider Provider { get; set; }

    [Required, MaxLength(200)]
    public string DisplayName { get; set; } = default!;

    [MaxLength(500)]
    public string? ApiKey { get; set; }

    [MaxLength(500)]
    public string? ApiSecret { get; set; }

    [MaxLength(500)]
    public string? AccountSid { get; set; }

    [MaxLength(200)]
    public string? SenderId { get; set; }

    [MaxLength(500)]
    public string? ServiceSid { get; set; }

    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }

    public int OtpLength { get; set; } = 6;
    public int ExpiryMinutes { get; set; } = 5;
    public int MaxRetries { get; set; } = 3;
    public int CooldownSeconds { get; set; } = 60;

    [MaxLength(500)]
    public string? MessageTemplate { get; set; } = "رمز التحقق الخاص بك هو: {code}";

    public DateTime? LastTestedAt { get; set; }
    public bool? LastTestResult { get; set; }

    [MaxLength(1000)]
    public string? AdditionalConfig { get; set; }
}

// ============================================================
// OTP Log
// ============================================================

