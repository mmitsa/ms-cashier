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

    // Customer classification
    public bool IsCompany { get; set; } // true=شركة, false=فرد

    // Company-specific (required when IsCompany=true)
    [MaxLength(50)]
    public string? CommercialRegister { get; set; } // السجل التجاري

    // Individual-specific (required when IsCompany=false for credit customers)
    [MaxLength(20)]
    public string? NationalId { get; set; } // رقم الهوية

    // Bank details
    [MaxLength(100)]
    public string? BankName { get; set; }

    [MaxLength(50)]
    public string? BankAccountNumber { get; set; }

    [MaxLength(34)]
    public string? Iban { get; set; }

    // Credit terms
    public int? CreditPeriodDays { get; set; } // مدة السداد بالأيام

    [MaxLength(50)]
    public string? PaymentMethod { get; set; } // طريقة السداد المفضلة (تحويل/شيك/نقد)

    // Project linkage
    [MaxLength(200)]
    public string? ProjectName { get; set; } // اسم المشروع (if credit is project-based)

    // Navigation
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}

// ============================================================
// Invoice & InvoiceItem
// ============================================================

