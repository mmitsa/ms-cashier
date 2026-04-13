using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

// ============================================================
// Online Payment Config
// ============================================================

public class OnlinePaymentConfig : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int OnlineStoreId { get; set; }

    [Required, MaxLength(50)]
    public string Provider { get; set; } = default!; // stripe, paytabs, tap, moyasar, fawry

    [MaxLength(500)]
    public string? ApiKey { get; set; } // encrypted

    [MaxLength(500)]
    public string? SecretKey { get; set; } // encrypted

    [MaxLength(500)]
    public string? WebhookSecret { get; set; } // encrypted

    [MaxLength(10)]
    public string Currency { get; set; } = "SAR";

    public bool IsActive { get; set; } = true;
    public bool IsTestMode { get; set; } = true;

    [Column(TypeName = "nvarchar(max)")]
    public string? SupportedMethods { get; set; } // JSON

    // Navigation
    public OnlineStore? OnlineStore { get; set; }
}
