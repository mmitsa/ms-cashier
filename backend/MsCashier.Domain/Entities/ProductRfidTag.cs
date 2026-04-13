using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public class ProductRfidTag : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int ProductId { get; set; }

    public int? ProductVariantId { get; set; }

    [Required, MaxLength(100)]
    public string RfidTagId { get; set; } = default!; // EPC

    [MaxLength(20)]
    public string TagType { get; set; } = "UHF"; // UHF, HF, NFC

    public int? WarehouseId { get; set; }

    [MaxLength(50)]
    public string? ShelfLocation { get; set; } // A1-R3-S5

    public bool IsActive { get; set; } = true;

    public DateTime TaggedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastScannedAt { get; set; }

    // Navigation
    public Product? Product { get; set; }
    public ProductVariant? ProductVariant { get; set; }
    public Warehouse? Warehouse { get; set; }
}
