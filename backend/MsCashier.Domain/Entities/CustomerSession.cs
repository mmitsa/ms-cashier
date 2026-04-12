using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class CustomerSession
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public int QrConfigId { get; set; }

    [MaxLength(100)]
    public string SessionToken { get; set; } = Guid.NewGuid().ToString("N");

    public QrSessionType SessionType { get; set; } = QrSessionType.DineIn;

    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(20)]
    public string? CustomerPhone { get; set; }

    public int? TableId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public StoreQrConfig? QrConfig { get; set; }
    public Tenant? Tenant { get; set; }
    public ICollection<CustomerOrder> Orders { get; set; } = new List<CustomerOrder>();
}

