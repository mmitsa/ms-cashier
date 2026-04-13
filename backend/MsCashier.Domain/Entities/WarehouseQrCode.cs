using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public class WarehouseQrCode : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int WarehouseId { get; set; }

    [Required, MaxLength(500)]
    public string QrCodeData { get; set; } = default!;

    [MaxLength(20)]
    public string QrType { get; set; } = "warehouse"; // warehouse, zone, shelf, bin

    [MaxLength(50)]
    public string LocationCode { get; set; } = default!; // WH01-Z02-S03

    [MaxLength(200)]
    public string? Description { get; set; }

    // Navigation
    public Warehouse? Warehouse { get; set; }
}
