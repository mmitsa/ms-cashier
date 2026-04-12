using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

public class UserPermission
{
    [Key]
    public int Id { get; set; }

    public Guid UserId { get; set; }

    [Required, MaxLength(100)]
    public string Permission { get; set; } = default!;

    public bool IsGranted { get; set; } = true;

    // Navigation
    public User? User { get; set; }
}

// ============================================================
// Category & Unit
// ============================================================

