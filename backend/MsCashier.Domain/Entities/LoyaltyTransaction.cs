using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

// ============================================================
// LoyaltyTransaction — حركات نقاط الولاء
// ============================================================

public enum LoyaltyTransactionType : byte
{
    Earn = 1,
    Redeem = 2,
    Expire = 3,
    Adjust = 4
}

public class LoyaltyTransaction : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int CustomerLoyaltyId { get; set; }
    public long? InvoiceId { get; set; }

    public LoyaltyTransactionType Type { get; set; }
    public int Points { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime? ExpiresAt { get; set; }

    // Navigation
    public CustomerLoyalty? CustomerLoyalty { get; set; }
    public Invoice? Invoice { get; set; }
}
