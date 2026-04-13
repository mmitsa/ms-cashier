using MsCashier.Domain.Common;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MsCashier.Domain.Entities;

/// <summary>Variant dimension (e.g. "Size", "Color")</summary>
public class ProductVariantOption : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int ProductId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = default!;

    public int SortOrder { get; set; }

    // Navigation
    public Product? Product { get; set; }
    public ICollection<ProductVariantValue> Values { get; set; } = new List<ProductVariantValue>();
}
