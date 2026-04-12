using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class CustomerOrder
{
    [Key]
    public long Id { get; set; }

    public Guid TenantId { get; set; }
    public Guid SessionId { get; set; }

    [Required, MaxLength(50)]
    public string OrderNumber { get; set; } = default!;

    public CustomerOrderStatus Status { get; set; } = CustomerOrderStatus.Cart;
    public QrSessionType OrderType { get; set; } = QrSessionType.DineIn;

    public int? TableId { get; set; }

    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(20)]
    public string? CustomerPhone { get; set; }

    [MaxLength(500)]
    public string? DeliveryAddress { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ServiceCharge { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    public CustomerPaymentMethod? PaymentMethod { get; set; }

    [MaxLength(100)]
    public string? PaymentReference { get; set; }

    public DateTime? PaidAt { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public long? DineOrderId { get; set; }

    public int? EstimatedMinutes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? KitchenSentAt { get; set; }
    public DateTime? ReadyAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public CustomerSession? Session { get; set; }
    public Tenant? Tenant { get; set; }
    public DineOrder? DineOrder { get; set; }
    public RestaurantTable? Table { get; set; }
    public ICollection<CustomerOrderItem> Items { get; set; } = new List<CustomerOrderItem>();
}

