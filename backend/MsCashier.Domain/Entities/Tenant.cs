using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Tenant & Plan
// ============================================================

public class Tenant : BaseEntity
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

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

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(50)]
    public string? TaxNumber { get; set; }

    [MaxLength(50)]
    public string? CommercialReg { get; set; }

    public int PlanId { get; set; }

    public TenantStatus Status { get; set; } = TenantStatus.Active;

    public DateTime SubscriptionStart { get; set; }
    public DateTime? SubscriptionEnd { get; set; }

    public int MaxUsers { get; set; }
    public int MaxWarehouses { get; set; }
    public int MaxPosStations { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Settings { get; set; }

    [MaxLength(10)]
    public string CurrencyCode { get; set; } = "SAR";

    [Required]
    [MaxLength(50)]
    public string VatNumber { get; set; } = string.Empty;

    public bool ZatcaEnabled { get; set; } = false;

    public DateTime? TrialEndDate { get; set; }

    [MaxLength(200)]
    public string? AdminEmail { get; set; }

    // Navigation
    public Plan? Plan { get; set; }
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Warehouse> Warehouses { get; set; } = new List<Warehouse>();
}

