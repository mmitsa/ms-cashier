using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class SocialMediaPost : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(2000)]
    public string? Content { get; set; }

    [MaxLength(2000)]
    public string? ContentAr { get; set; }

    /// <summary>JSON array of image URLs</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? ImageUrls { get; set; }

    [MaxLength(500)]
    public string? VideoUrl { get; set; }

    [MaxLength(500)]
    public string? Hashtags { get; set; }

    public SocialMediaPostType Type { get; set; }

    public int? ProductId { get; set; }

    public SocialMediaPostStatus Status { get; set; } = SocialMediaPostStatus.Draft;

    public DateTime? ScheduledAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    /// <summary>JSON results from each platform publish attempt</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? PublishResults { get; set; }

    // Navigation
    public ICollection<SocialMediaPostTarget> Targets { get; set; } = new List<SocialMediaPostTarget>();
}
