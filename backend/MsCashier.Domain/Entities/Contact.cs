using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Contact
// ============================================================

public class Contact : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public ContactType ContactType { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(20)]
    public string? Phone2 { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(50)]
    public string? TaxNumber { get; set; }

    public PriceType PriceType { get; set; } = PriceType.Retail;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CreditLimit { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}

// ============================================================
// Invoice & InvoiceItem
// ============================================================

