using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Online Payment Transaction
// ============================================================

public class OnlinePayment : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int GatewayConfigId { get; set; }
    public PaymentGatewayType GatewayType { get; set; }

    [MaxLength(200)]
    public string? GatewayTransactionId { get; set; }

    [MaxLength(200)]
    public string? GatewayReferenceId { get; set; }

    public decimal Amount { get; set; }

    [MaxLength(10)]
    public string CurrencyCode { get; set; } = "SAR";

    public OnlinePaymentStatus Status { get; set; } = OnlinePaymentStatus.Pending;

    [MaxLength(500)]
    public string? PaymentUrl { get; set; }

    [MaxLength(100)]
    public string? PaymentMethod { get; set; }

    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(200)]
    public string? CustomerEmail { get; set; }

    [MaxLength(20)]
    public string? CustomerPhone { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? InvoiceReference { get; set; }

    public long? InvoiceId { get; set; }

    [MaxLength(2000)]
    public string? GatewayResponse { get; set; }

    [MaxLength(500)]
    public string? FailureReason { get; set; }

    public DateTime? PaidAt { get; set; }

    // Navigation
    public PaymentGatewayConfig? GatewayConfig { get; set; }
}

// ============================================================
// OTP Configuration (per tenant)
// ============================================================

