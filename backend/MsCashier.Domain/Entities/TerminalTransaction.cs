using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class TerminalTransaction : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int TerminalId { get; set; }
    public long? InvoiceId { get; set; }

    [Required, MaxLength(50)]
    public string ReferenceNumber { get; set; } = default!;

    public TerminalTxnType TxnType { get; set; } = TerminalTxnType.Purchase;
    public TerminalTxnStatus Status { get; set; } = TerminalTxnStatus.Initiated;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? TipAmount { get; set; }

    [MaxLength(10)]
    public string Currency { get; set; } = "SAR";

    public CardScheme? CardScheme { get; set; }

    [MaxLength(20)]
    public string? CardLast4 { get; set; }

    [MaxLength(100)]
    public string? AuthCode { get; set; }

    [MaxLength(100)]
    public string? RRN { get; set; } // Retrieval Reference Number

    [MaxLength(100)]
    public string? ProviderTxnId { get; set; }

    [MaxLength(20)]
    public string? ResponseCode { get; set; }

    [MaxLength(500)]
    public string? ResponseMessage { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? ReceiptData { get; set; } // Terminal receipt text

    [Column(TypeName = "nvarchar(max)")]
    public string? RawResponse { get; set; } // Full provider response JSON

    public DateTime InitiatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public PaymentTerminal? Terminal { get; set; }
    public Invoice? Invoice { get; set; }
}

// ============================================================
// Recipe & Ingredients (Production / Kitchen)
// ============================================================

