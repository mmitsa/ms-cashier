using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities.Accounting;

/// <summary>
/// سطر قيد يومية (Debit XOR Credit). الإجمالي يجب أن يساوي إجمالي السطور المقابلة في نفس JournalEntry.
/// </summary>
public class JournalLine : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public long JournalEntryId { get; set; }
    public JournalEntry? JournalEntry { get; set; }

    public short LineNumber { get; set; }

    public int AccountId { get; set; }
    public ChartOfAccount? Account { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Debit { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Credit { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>للذمم: ربط السطر بمورد/عميل (Sub-ledger).</summary>
    public int? ContactId { get; set; }

    public int? BranchId { get; set; }

    [MaxLength(50)]
    public string? CostCenter { get; set; }
}
