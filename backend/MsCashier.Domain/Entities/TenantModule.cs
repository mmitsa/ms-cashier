using System.ComponentModel.DataAnnotations;
using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

public class TenantModule : BaseEntity
{
    public int Id { get; set; }

    public Guid TenantId { get; set; }

    [Required, MaxLength(50)]
    public string ModuleKey { get; set; } = default!;

    public bool IsEnabled { get; set; }

    public DateTime? EnabledAt { get; set; }

    public Guid? EnabledBy { get; set; }

    public Tenant? Tenant { get; set; }
}
