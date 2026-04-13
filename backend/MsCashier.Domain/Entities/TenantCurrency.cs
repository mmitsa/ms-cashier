using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

/// <summary>
/// عملة مفعّلة للمستأجر مع سعر الصرف مقابل العملة الأساسية.
/// مثال: المستأجر عملته الأساسية جنيه مصري (EGP) ويقبل دولار (USD) بسعر 50.5
/// </summary>
public class TenantCurrency : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(10)]
    public string CurrencyCode { get; set; } = default!;

    [Required, MaxLength(50)]
    public string CurrencyName { get; set; } = default!;

    [MaxLength(5)]
    public string? Symbol { get; set; }

    /// <summary>سعر الصرف مقابل العملة الأساسية (1 وحدة من هذه = X من الأساسية)</summary>
    [Column(TypeName = "decimal(18,6)")]
    public decimal ExchangeRate { get; set; } = 1;

    /// <summary>هل هذه العملة الأساسية للمستأجر</summary>
    public bool IsDefault { get; set; }

    public bool IsActive { get; set; } = true;
}
