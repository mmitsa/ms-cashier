using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class ProductKitchenStation
{
    [Key]
    public int Id { get; set; }

    public int ProductId { get; set; }
    public int KitchenStationId { get; set; }

    public int Priority { get; set; } = 0;
    public int? EstimatedPrepMinutes { get; set; }

    // Navigation
    public Product? Product { get; set; }
    public KitchenStation? KitchenStation { get; set; }
}

// ============================================================
// Production Order
// ============================================================

