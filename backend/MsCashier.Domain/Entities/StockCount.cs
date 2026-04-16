using MsCashier.Domain.Common;

namespace MsCashier.Domain.Entities;

/// <summary>جلسة جرد مخزون — تحتوي على قائمة أصناف مع الرصيد الفعلي</summary>
public class StockCount : TenantEntity
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string? Notes { get; set; }
    public StockCountStatus Status { get; set; } = StockCountStatus.InProgress;
    public Guid CreatedBy { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public Warehouse Warehouse { get; set; } = null!;
    public ICollection<StockCountItem> Items { get; set; } = [];
}

/// <summary>سطر جرد لصنف واحد</summary>
public class StockCountItem
{
    public long Id { get; set; }
    public int StockCountId { get; set; }
    public int ProductId { get; set; }
    public decimal SystemQty { get; set; }
    public decimal CountedQty { get; set; }
    public decimal Variance => CountedQty - SystemQty;
    public StockCountItemStatus Status { get; set; } = StockCountItemStatus.Pending;
    public bool IsSettled { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public StockCount StockCount { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

public enum StockCountStatus : byte
{
    InProgress = 1,
    Completed = 2,
    Cancelled = 3
}

public enum StockCountItemStatus : byte
{
    Pending = 0,
    Matched = 1,
    Shortage = 2,
    Surplus = 3
}
