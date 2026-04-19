using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Domain.Entities;

// ============================================================
// Cashier Shift — افتتاح/إغلاق وردية الكاشير
// ============================================================

public class CashierShift : TenantEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>الكاشير صاحب الوردية</summary>
    public Guid UserId { get; set; }

    /// <summary>نقطة البيع/المخزن (اختياري)</summary>
    public int? WarehouseId { get; set; }

    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    /// <summary>افتتاحية الدرج</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal OpeningCash { get; set; }

    /// <summary>حسب المبيعات النقدية</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? ExpectedCash { get; set; }

    /// <summary>المعدود فعلياً</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? ActualCash { get; set; }

    /// <summary>عجز/زيادة</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? CashDifference { get; set; }

    /// <summary>إجمالي مبيعات الشيفت</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalSales { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCashSales { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCardSales { get; set; }

    public int InvoiceCount { get; set; }

    [MaxLength(500)]
    public string? OpeningNotes { get; set; }

    [MaxLength(500)]
    public string? ClosingNotes { get; set; }

    public CashierShiftStatus Status { get; set; } = CashierShiftStatus.Open;

    // Navigation
    public User? User { get; set; }
    public Warehouse? Warehouse { get; set; }
}
