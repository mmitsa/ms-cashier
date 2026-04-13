using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class SocialMediaPostTarget : TenantEntity
{
    [Key]
    public int Id { get; set; }

    public int PostId { get; set; }
    public int SocialMediaAccountId { get; set; }

    [MaxLength(200)]
    public string? PlatformPostId { get; set; }

    public SocialMediaPostStatus Status { get; set; } = SocialMediaPostStatus.Draft;

    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    // Navigation
    public SocialMediaPost? Post { get; set; }
    public SocialMediaAccount? Account { get; set; }
}
