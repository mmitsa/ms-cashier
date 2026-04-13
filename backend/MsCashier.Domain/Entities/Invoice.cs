using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Invoice & InvoiceItem
// ============================================================

public class Invoice : TenantEntity
{
    [Key]
    public long Id { get; set; }

    [Required, MaxLength(50)]
    public string InvoiceNumber { get; set; } = default!;

    public InvoiceType InvoiceType { get; set; }
    public DateTime InvoiceDate { get; set; }

    public int? ContactId { get; set; }
    public int WarehouseId { get; set; }

    public PriceType PriceType { get; set; } = PriceType.Retail;

    [Column(TypeName = "decimal(18,2)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? DiscountPercent { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PaidAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DueAmount { get; set; }

    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus PaymentStatus { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public Guid CreatedBy { get; set; }

    public bool ZatcaReported { get; set; } = false;

    [MaxLength(500)]
    public string? ZatcaInvoiceHash { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? ZatcaQrCode { get; set; }

    /// <summary>مندوب المبيعات (إن وجد) — الفاتورة تبقى معلقة لحد السداد</summary>
    public int? SalesRepId { get; set; }

    /// <summary>عملة الفاتورة (null = العملة الأساسية للمستأجر)</summary>
    [MaxLength(10)]
    public string? CurrencyCode { get; set; }

    /// <summary>سعر الصرف وقت إنشاء الفاتورة (1 وحدة عملة = X عملة أساسية)</summary>
    [Column(TypeName = "decimal(18,6)")]
    public decimal? ExchangeRate { get; set; }

    /// <summary>إجمالي بالعملة الأساسية = TotalAmount × ExchangeRate</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? TotalInBaseCurrency { get; set; }

    // Navigation
    public Contact? Contact { get; set; }
    public Warehouse? Warehouse { get; set; }
    public User? Creator { get; set; }
    public SalesRep? SalesRep { get; set; }
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}

