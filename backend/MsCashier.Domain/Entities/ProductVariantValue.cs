using MsCashier.Domain.Common;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MsCashier.Domain.Entities;

/// <summary>Variant value (e.g. "Small", "Red")</summary>
public class ProductVariantValue : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int VariantOptionId { get; set; }

    [Required, MaxLength(100)]
    public string Value { get; set; } = default!;

    public int SortOrder { get; set; }

    // Navigation
    public ProductVariantOption? VariantOption { get; set; }
}
