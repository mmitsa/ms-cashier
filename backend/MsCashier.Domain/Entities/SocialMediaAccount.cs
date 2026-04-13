using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public class SocialMediaAccount : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(30)]
    public string Platform { get; set; } = default!; // facebook, instagram, twitter, tiktok, snapchat, whatsapp

    [MaxLength(200)]
    public string? AccountName { get; set; }

    [MaxLength(200)]
    public string? AccountId { get; set; }

    [MaxLength(1000)]
    public string? AccessToken { get; set; }

    [MaxLength(1000)]
    public string? RefreshToken { get; set; }

    public DateTime? TokenExpiresAt { get; set; }

    [MaxLength(200)]
    public string? PageId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;
}
