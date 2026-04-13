using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class Inventory
{
    [Key]
    public long Id { get; set; }

    public Guid TenantId { get; set; }
    public int ProductId { get; set; }
    public int? ProductVariantId { get; set; }
    public int WarehouseId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ReservedQty { get; set; }

    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    // Computed
    [NotMapped]
    public decimal AvailableQty => Quantity - ReservedQty;

    // Navigation
    public Product? Product { get; set; }
    public ProductVariant? ProductVariant { get; set; }
    public Warehouse? Warehouse { get; set; }
}

