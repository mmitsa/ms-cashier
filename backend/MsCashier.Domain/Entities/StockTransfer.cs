using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Stock Transfer
// ============================================================

public class StockTransfer : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string TransferNumber { get; set; } = default!;

    public int FromWarehouseId { get; set; }
    public int ToWarehouseId { get; set; }

    public byte Status { get; set; } = 1;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public Guid CreatedBy { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public ICollection<StockTransferItem> Items { get; set; } = new List<StockTransferItem>();
}

