using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Customer Self-Order (QR Code)
// ============================================================

public class StoreQrConfig : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Code { get; set; } = Guid.NewGuid().ToString("N")[..12];

    public int? TableId { get; set; }
    public int? BranchId { get; set; }

    public QrSessionType DefaultType { get; set; } = QrSessionType.DineIn;

    public bool IsActive { get; set; } = true;
    public bool AllowRemoteOrder { get; set; } = true;
    public bool RequirePhone { get; set; } = true;
    public bool AllowCashPayment { get; set; } = true;
    public bool AllowOnlinePayment { get; set; } = true;

    [Column(TypeName = "decimal(5,2)")]
    public decimal? ServiceChargePercent { get; set; }

    [MaxLength(1000)]
    public string? WelcomeMessage { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(50)]
    public string ThemeColor { get; set; } = "#6366f1";

    // Navigation
    public RestaurantTable? Table { get; set; }
    public Branch? Branch { get; set; }
}

