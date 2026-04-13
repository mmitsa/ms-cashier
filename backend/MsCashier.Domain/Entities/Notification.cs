using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public class Notification : TenantEntity
{
    [Key]
    public long Id { get; set; }

    /// <summary>Target user (null = all users in tenant)</summary>
    public Guid? UserId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = default!;

    [MaxLength(1000)]
    public string? Body { get; set; }

    [MaxLength(50)]
    public string Type { get; set; } = "info";

    [MaxLength(50)]
    public string? EntityType { get; set; }

    [MaxLength(100)]
    public string? EntityId { get; set; }

    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
