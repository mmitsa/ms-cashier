using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Online Order
// ============================================================

public class OnlineOrder : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int OnlineStoreId { get; set; }

    [Required, MaxLength(50)]
    public string OrderNumber { get; set; } = default!;

    public int? ContactId { get; set; }

    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(30)]
    public string? CustomerPhone { get; set; }

    [MaxLength(200)]
    public string? CustomerEmail { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? ShippingAddress { get; set; } // JSON

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ShippingFee { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    public OnlineOrderStatus Status { get; set; } = OnlineOrderStatus.Pending;
    public OnlinePaymentStatus PaymentStatus { get; set; } = OnlinePaymentStatus.Pending;

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    [MaxLength(200)]
    public string? PaymentReference { get; set; }

    public long? InvoiceId { get; set; }

    public bool IsPrintedForPreparation { get; set; }
    public DateTime? PrintedAt { get; set; }

    public OnlineOrderType OrderType { get; set; } = OnlineOrderType.Delivery;

    [MaxLength(1000)]
    public string? DeliveryNotes { get; set; }

    public DateTime? EstimatedDeliveryAt { get; set; }

    // Navigation
    public OnlineStore? OnlineStore { get; set; }
    public Contact? Contact { get; set; }
    public Invoice? Invoice { get; set; }
    public ICollection<OnlineOrderItem> Items { get; set; } = new List<OnlineOrderItem>();
}
