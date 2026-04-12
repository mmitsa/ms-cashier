using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Audit Log
// ============================================================

public class AuditLog
{
    [Key]
    public long Id { get; set; }

    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }

    [Required, MaxLength(100)]
    public string Action { get; set; } = default!;

    [Required, MaxLength(100)]
    public string EntityType { get; set; } = default!;

    [MaxLength(100)]
    public string? EntityId { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? OldValues { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? NewValues { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ============================================================
// Subscription Request
// ============================================================

