using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

/// <summary>
/// إعدادات الربط مع مصلحة الضرائب المصرية (ETA) / أي جهة ضريبية.
/// يدعم: الفاتورة الإلكترونية المصرية، زاتكا السعودية، أو أي مزود آخر.
/// </summary>
public class TenantTaxConfig : TenantEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>نوع المزود: ETA, ZATCA, Manual</summary>
    [Required, MaxLength(20)]
    public string Provider { get; set; } = "ETA";

    /// <summary>هل الربط مفعّل</summary>
    public bool IsEnabled { get; set; }

    // ─── ETA-specific (مصلحة الضرائب المصرية) ─────────────
    [MaxLength(100)]
    public string? EtaClientId { get; set; }

    [MaxLength(200)]
    public string? EtaClientSecret { get; set; }

    [MaxLength(300)]
    public string? EtaApiUrl { get; set; }

    [MaxLength(50)]
    public string? EtaBranchCode { get; set; }

    [MaxLength(50)]
    public string? EtaActivityCode { get; set; }

    /// <summary>رقم التسجيل الضريبي (يختلف عن VatNumber للمتجر)</summary>
    [MaxLength(50)]
    public string? TaxRegistrationNumber { get; set; }

    // ─── Tax rates ────────────────────────────────────────
    /// <summary>نسبة ضريبة القيمة المضافة الافتراضية (مصر: 14%، السعودية: 15%)</summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal DefaultVatRate { get; set; } = 14;

    /// <summary>نسبة ضريبة الجدول (مصر فقط — على بعض السلع)</summary>
    [Column(TypeName = "decimal(5,2)")]
    public decimal? TableTaxRate { get; set; }

    /// <summary>هل يتم تضمين الضريبة في السعر أم تُضاف</summary>
    public bool TaxInclusive { get; set; } = true;

    // ─── Last sync info ──────────────────────────────────
    public DateTime? LastSyncAt { get; set; }

    [MaxLength(500)]
    public string? LastSyncStatus { get; set; }

    public int TotalSubmitted { get; set; }
    public int TotalAccepted { get; set; }
    public int TotalRejected { get; set; }
}
