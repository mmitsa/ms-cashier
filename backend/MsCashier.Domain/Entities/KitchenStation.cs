using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Kitchen Station & Routing
// ============================================================

public class KitchenStation : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Code { get; set; } = default!;

    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    public KitchenStationType StationType { get; set; } = KitchenStationType.Preparation;

    public int DisplayOrder { get; set; }

    [MaxLength(20)]
    public string Color { get; set; } = "#FF5722";

    public bool IsActive { get; set; } = true;
    public int MaxConcurrentOrders { get; set; } = 20;
    public int AveragePreparationMinutes { get; set; } = 15;

    public int? BranchId { get; set; }

    // Navigation
    public Branch? Branch { get; set; }
    public ICollection<ProductKitchenStation> ProductStations { get; set; } = new List<ProductKitchenStation>();
}

