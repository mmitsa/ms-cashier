using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Dine Order (Waiter / Take-Away / Delivery)
// ============================================================

public class DineOrder : TenantEntity
{
    [Key]
    public long Id { get; set; }

    [Required, MaxLength(50)]
    public string OrderNumber { get; set; } = default!;

    public DineOrderType OrderType { get; set; } = DineOrderType.DineIn;
    public DineOrderStatus Status { get; set; } = DineOrderStatus.New;

    public int? TableId { get; set; }
    public int? GuestCount { get; set; }

    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(20)]
    public string? CustomerPhone { get; set; }

    [MaxLength(500)]
    public string? DeliveryAddress { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public Guid WaiterId { get; set; }
    public long? InvoiceId { get; set; }

    public DateTime? KitchenSentAt { get; set; }
    public DateTime? ReadyAt { get; set; }
    public DateTime? ServedAt { get; set; }
    public DateTime? BilledAt { get; set; }

    // Navigation
    public RestaurantTable? Table { get; set; }
    public User? Waiter { get; set; }
    public Invoice? Invoice { get; set; }
    public ICollection<DineOrderItem> Items { get; set; } = new List<DineOrderItem>();
}

// ============================================================
// Dine Order Item
// ============================================================

