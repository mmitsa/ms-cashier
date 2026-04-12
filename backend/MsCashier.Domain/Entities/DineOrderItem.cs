using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Dine Order Item
// ============================================================

public class DineOrderItem
{
    [Key]
    public long Id { get; set; }

    public long OrderId { get; set; }
    public int ProductId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }

    public OrderItemKitchenStatus KitchenStatus { get; set; } = OrderItemKitchenStatus.Pending;

    [MaxLength(500)]
    public string? SpecialNotes { get; set; }

    public DateTime? SentToKitchenAt { get; set; }
    public DateTime? ReadyAt { get; set; }

    // Navigation
    public DineOrder? Order { get; set; }
    public Product? Product { get; set; }
}

// ============================================================
// Customer Self-Order (QR Code)
// ============================================================

