using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public class WebhookSubscription : TenantEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(500)]
    public string Url { get; set; } = default!;

    [MaxLength(64)]
    public string Secret { get; set; } = default!;

    [Required, MaxLength(1000)]
    public string Events { get; set; } = default!;

    public bool IsActive { get; set; } = true;

    public int FailureCount { get; set; }

    public int MaxFailures { get; set; } = 10;

    public DateTime? LastDeliveredAt { get; set; }
}
