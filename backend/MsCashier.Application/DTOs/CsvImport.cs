namespace MsCashier.Application.DTOs;

// ═══════════════════════════════════════════════════════════
// CSV Import DTOs
// ═══════════════════════════════════════════════════════════

public record CsvImportRequest(
    Stream FileStream,
    string FileName,
    CsvImportType ImportType,
    bool SkipDuplicates = true,
    int WarehouseId = 0
);

public record CsvImportResult(
    int TotalRows,
    int SuccessCount,
    int SkippedCount,
    int ErrorCount,
    List<CsvImportError> Errors,
    List<string> Warnings
);

public record CsvImportError(
    int Row,
    string Field,
    string Value,
    string Message
);

public record CsvExportRequest(
    CsvImportType ExportType,
    int? CategoryId = null,
    bool ActiveOnly = true
);

// ── Product CSV row ──
public record ProductCsvRow
{
    public string? Barcode { get; set; }
    public string? SKU { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public string? CategoryName { get; set; }
    public string? UnitName { get; set; }
    public decimal CostPrice { get; set; }
    public decimal RetailPrice { get; set; }
    public decimal? HalfWholesalePrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public decimal? TaxRate { get; set; }
    public decimal MinStock { get; set; }
    public decimal? MaxStock { get; set; }
    public decimal InitialStock { get; set; }
}

// ── Contact CSV row ──
public record ContactCsvRow
{
    public string Name { get; set; } = default!;
    public string? Phone { get; set; }
    public string? Phone2 { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? TaxNumber { get; set; }
    public string Type { get; set; } = "Customer"; // Customer, Supplier, Both
    public decimal? CreditLimit { get; set; }
    public string? Notes { get; set; }
}

// ── Category CSV row ──
public record CategoryCsvRow
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public string? ParentCategoryName { get; set; }
    public int SortOrder { get; set; }
}

public enum CsvImportType : byte
{
    Products = 1,
    Contacts = 2,
    Categories = 3
}
