using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MsCashier.Domain.Entities;

public class BundleItem
{
    [Key]
    public int Id { get; set; }

    public Guid TenantId { get; set; }

    public int ProductId { get; set; }     // The bundle (parent)

    public int ComponentId { get; set; }   // The component product

    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    public int SortOrder { get; set; }

    // Navigation
    public Product? Product { get; set; }
    public Product? Component { get; set; }
}
