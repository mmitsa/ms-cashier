using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Payment Gateway Configuration (per tenant)
// ============================================================

public class PaymentGatewayConfig : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public PaymentGatewayType GatewayType { get; set; }

    [Required, MaxLength(200)]
    public string DisplayName { get; set; } = default!;

    [MaxLength(500)]
    public string? ApiKey { get; set; }

    [MaxLength(500)]
    public string? SecretKey { get; set; }

    [MaxLength(500)]
    public string? MerchantId { get; set; }

    [MaxLength(500)]
    public string? PublishableKey { get; set; }

    [MaxLength(1000)]
    public string? WebhookSecret { get; set; }

    [MaxLength(500)]
    public string? CallbackUrl { get; set; }

    public bool IsLiveMode { get; set; }
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }

    [MaxLength(100)]
    public string CurrencyCode { get; set; } = "SAR";

    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }

    [MaxLength(2000)]
    public string? AdditionalConfig { get; set; }

    public DateTime? LastTestedAt { get; set; }
    public bool? LastTestResult { get; set; }
}

// ============================================================
// Online Payment Transaction
// ============================================================

