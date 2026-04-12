using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// User & Permissions
// ============================================================

public class User : TenantEntity
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public string Username { get; set; } = default!;

    [Required, MaxLength(500)]
    public string PasswordHash { get; set; } = default!;

    [Required, MaxLength(200)]
    public string FullName { get; set; } = default!;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string Role { get; set; } = "Cashier";

    public bool IsActive { get; set; } = true;

    public DateTime? LastLoginAt { get; set; }

    [MaxLength(500)]
    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiry { get; set; }

    // Navigation
    public ICollection<UserPermission> Permissions { get; set; } = new List<UserPermission>();
}

