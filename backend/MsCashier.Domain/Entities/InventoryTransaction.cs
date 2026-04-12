using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class InventoryTransaction
{
    [Key]
    public long Id { get; set; }

    public Guid TenantId { get; set; }
    public int ProductId { get; set; }
    public int WarehouseId { get; set; }

    public InventoryTransactionType TransactionType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PreviousQty { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NewQty { get; set; }

    [MaxLength(100)]
    public string? ReferenceType { get; set; }

    [MaxLength(100)]
    public string? ReferenceId { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Product? Product { get; set; }
    public Warehouse? Warehouse { get; set; }
}

// ============================================================
// Stock Transfer
// ============================================================

