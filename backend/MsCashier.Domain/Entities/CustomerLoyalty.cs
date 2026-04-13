using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

// ============================================================
// CustomerLoyalty — عضوية العميل في برنامج الولاء
// ============================================================

public class CustomerLoyalty : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int ContactId { get; set; }
    public int LoyaltyProgramId { get; set; }

    public int CurrentPoints { get; set; }
    public int TotalEarnedPoints { get; set; }
    public int TotalRedeemedPoints { get; set; }

    [MaxLength(50)]
    public string? LoyaltyCardBarcode { get; set; }

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Contact? Contact { get; set; }
    public LoyaltyProgram? LoyaltyProgram { get; set; }
}
