using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums.Accounting;

namespace MsCashier.Domain.Entities.Accounting;

/// <summary>
/// قيد يومية (Header). يحتوي على سطور Debit/Credit متوازنة في JournalLine.
/// </summary>
public class JournalEntry : TenantEntity
{
    [Key]
    public long Id { get; set; }

    /// <summary>رقم القيد التسلسلي داخل التينانت (مثال: "JE-2026-000123").</summary>
    [Required, MaxLength(50)]
    public string EntryNumber { get; set; } = default!;

    public DateTime EntryDate { get; set; }

    public int PeriodId { get; set; }
    public AccountingPeriod? Period { get; set; }

    /// <summary>مرجع خارجي (مثل INV-123 أو PO-45).</summary>
    [MaxLength(100)]
    public string? Reference { get; set; }

    [MaxLength(500)]
    public string? DescriptionAr { get; set; }

    [MaxLength(500)]
    public string? DescriptionEn { get; set; }

    public JournalSource Source { get; set; } = JournalSource.Manual;

    /// <summary>اسم Entity المصدر (مثل "Invoice", "Payroll").</summary>
    [MaxLength(100)]
    public string? SourceType { get; set; }

    /// <summary>Id العملية المصدر في جدولها الأصلي.</summary>
    public long? SourceId { get; set; }

    public JournalStatus Status { get; set; } = JournalStatus.Draft;

    public DateTime? PostedAt { get; set; }
    public Guid? PostedBy { get; set; }

    /// <summary>إذا كان هذا القيد عكسياً لقيد آخر، Id القيد الأصلي.</summary>
    public long? ReversesEntryId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalDebit { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCredit { get; set; }

    public int? BranchId { get; set; }

    public ICollection<JournalLine> Lines { get; set; } = new List<JournalLine>();
}
