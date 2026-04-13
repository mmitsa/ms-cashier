using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public class WebhookDelivery : TenantEntity
{
    [Key]
    public long Id { get; set; }

    public int SubscriptionId { get; set; }

    [Required, MaxLength(100)]
    public string Event { get; set; } = default!;

    [Column(TypeName = "nvarchar(max)")]
    public string Payload { get; set; } = default!;

    public int StatusCode { get; set; }

    [MaxLength(2000)]
    public string? Response { get; set; }

    public bool Success { get; set; }

    public int DurationMs { get; set; }

    // Navigation
    public WebhookSubscription? Subscription { get; set; }
}
