using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class CustomerOrderItem
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

    [MaxLength(500)]
    public string? SpecialNotes { get; set; }

    // Navigation
    public CustomerOrder? Order { get; set; }
    public Product? Product { get; set; }
}

// ============================================================
// Payment Terminal (POS Machines — Saudi Market)
// ============================================================

