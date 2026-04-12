using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Subscription Request
// ============================================================

public class SubscriptionRequest
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string StoreName { get; set; } = default!;

    [MaxLength(100)]
    public string? BusinessType { get; set; }

    [Required, MaxLength(200)]
    public string OwnerName { get; set; } = default!;

    [Required, MaxLength(20)]
    public string Phone { get; set; } = default!;

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [Required, MaxLength(100)]
    public string City { get; set; } = default!;

    [Required, MaxLength(50)]
    public string VatNumber { get; set; } = default!;

    public int PlanId { get; set; }

    [Required, MaxLength(100)]
    public string AdminUsername { get; set; } = default!;

    [Required, MaxLength(200)]
    public string AdminFullName { get; set; } = default!;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public SubscriptionRequestStatus Status { get; set; } = SubscriptionRequestStatus.Pending;

    [MaxLength(500)]
    public string? AdminNotes { get; set; }

    public Guid? ApprovedTenantId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedBy { get; set; }

    // Navigation
    public Plan? Plan { get; set; }
}

// ============================================================
// Payment Gateway Configuration (per tenant)
// ============================================================

