using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

// ============================================================
// Store Banner
// ============================================================

public class StoreBanner : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int OnlineStoreId { get; set; }

    [Required, MaxLength(500)]
    public string ImageUrl { get; set; } = default!;

    [MaxLength(500)]
    public string? MobileImageUrl { get; set; }

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(200)]
    public string? TitleAr { get; set; }

    [MaxLength(500)]
    public string? Subtitle { get; set; }

    [MaxLength(500)]
    public string? LinkUrl { get; set; }

    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }

    // Navigation
    public OnlineStore? OnlineStore { get; set; }
}
