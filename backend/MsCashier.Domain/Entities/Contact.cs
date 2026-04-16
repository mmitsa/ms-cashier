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

    // ZATCA structured address fields
    [MaxLength(200)]
    public string? Street { get; set; } // الشارع

    [MaxLength(100)]
    public string? District { get; set; } // الحي

    [MaxLength(100)]
    public string? City { get; set; } // المدينة

    [MaxLength(100)]
    public string? Province { get; set; } // المحافظة

    [MaxLength(10)]
    public string? PostalCode { get; set; } // الرمز البريدي

    [MaxLength(5)]
    public string? CountryCode { get; set; } = "SA"; // رمز الدولة (ISO 3166-1 alpha-2)

    [MaxLength(10)]
    public string? BuildingNumber { get; set; } // رقم المبنى

    [MaxLength(50)]
    public string? PlotIdentification { get; set; } // معرّف قطعة الأرض (الرقم الإضافي)

    // ZATCA identification scheme
    [MaxLength(10)]
    public string? IdScheme { get; set; } // CRN, MOM, MLS, SAG, NAT, GCC, IQA, PAS, OTH

    [MaxLength(50)]
    public string? OtherId { get; set; } // معرف آخر

    // Contact person (for companies)
    [MaxLength(200)]
    public string? ContactPerson { get; set; } // صاحب العمل / الشخص المسؤول

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

