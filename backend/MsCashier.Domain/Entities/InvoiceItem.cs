using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class InvoiceItem
{
    [Key]
    public long Id { get; set; }

    public long InvoiceId { get; set; }
    public int ProductId { get; set; }
    public int? ProductVariantId { get; set; }

    [MaxLength(300)]
    public string? VariantDescription { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CostPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public long? BundleParentId { get; set; }

    public InvoiceItem? BundleParent { get; set; }
    public ICollection<InvoiceItem> BundleChildren { get; set; } = new List<InvoiceItem>();

    // Navigation
    public Invoice? Invoice { get; set; }
    public Product? Product { get; set; }
    public ProductVariant? ProductVariant { get; set; }
}

// ============================================================
// Installment & InstallmentPayment
// ============================================================

