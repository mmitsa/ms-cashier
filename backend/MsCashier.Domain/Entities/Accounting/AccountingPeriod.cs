using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities.Accounting;

/// <summary>
/// فترة محاسبية (شهر/ربع/سنة). القيود تُربط بفترة، ولا يمكن الترحيل لفترة مقفولة.
/// </summary>
public class AccountingPeriod : TenantEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>اسم الفترة (مثال: "2026-04" أو "Q1-2026").</summary>
    [Required, MaxLength(50)]
    public string Name { get; set; } = default!;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    /// <summary>سنة مالية (مثال 2026) — للتجميع.</summary>
    public int FiscalYear { get; set; }

    public bool IsClosed { get; set; }

    public DateTime? ClosedAt { get; set; }
    public Guid? ClosedBy { get; set; }
}
