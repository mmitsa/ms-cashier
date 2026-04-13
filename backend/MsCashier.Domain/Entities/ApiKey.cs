using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public class ApiKey : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = default!;

    [Required, MaxLength(64)]
    public string KeyHash { get; set; } = default!;

    [MaxLength(20)]
    public string KeyPrefix { get; set; } = default!;

    [MaxLength(500)]
    public string? Scopes { get; set; }

    public int RateLimitPerMinute { get; set; } = 100;

    public bool IsActive { get; set; } = true;

    public DateTime? ExpiresAt { get; set; }

    public DateTime? LastUsedAt { get; set; }

    public long RequestCount { get; set; }
}
