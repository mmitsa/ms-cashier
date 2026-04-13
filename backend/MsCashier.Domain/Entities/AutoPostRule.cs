using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public class AutoPostRule : TenantEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>new_product, new_offer, price_change</summary>
    [Required, MaxLength(50)]
    public string TriggerEvent { get; set; } = default!;

    /// <summary>JSON array of platform names</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? TargetPlatforms { get; set; }

    [MaxLength(2000)]
    public string? ContentTemplate { get; set; }

    [MaxLength(2000)]
    public string? ContentTemplateAr { get; set; }

    public bool IncludeImage { get; set; } = true;
    public bool IncludePrice { get; set; } = true;
    public bool IncludeStoreLink { get; set; } = true;
    public bool IsActive { get; set; } = true;
}
