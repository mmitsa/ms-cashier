namespace MsCashier.Application.DTOs;

// ═══════════════════════════════════════════════════════════
// Product Variant DTOs
// ═══════════════════════════════════════════════════════════

public record ProductVariantOptionDto(
    int Id,
    int ProductId,
    string Name,
    int SortOrder,
    List<ProductVariantValueDto> Values
);

public record ProductVariantValueDto(
    int Id,
    int VariantOptionId,
    string Value,
    int SortOrder
);

public record ProductVariantDto(
    int Id,
    int ProductId,
    string? Sku,
    string? Barcode,
    string VariantCombination,
    string? DisplayName,
    decimal CostPrice,
    decimal RetailPrice,
    decimal? HalfWholesalePrice,
    decimal? WholesalePrice,
    string? ImageUrl,
    bool IsActive,
    decimal CurrentStock
);

// ── Requests ──

public record CreateVariantOptionsRequest(
    int ProductId,
    List<VariantOptionInput> Options
);

public record VariantOptionInput(
    string Name,
    List<string> Values
);

public record GenerateVariantsRequest(
    int ProductId,
    decimal DefaultCostPrice,
    decimal DefaultRetailPrice,
    decimal? DefaultHalfWholesalePrice,
    decimal? DefaultWholesalePrice
);

public record UpdateVariantRequest(
    string? Sku,
    string? Barcode,
    decimal CostPrice,
    decimal RetailPrice,
    decimal? HalfWholesalePrice,
    decimal? WholesalePrice,
    string? ImageUrl,
    bool IsActive
);

public record ProductWithVariantsDto(
    int ProductId,
    string ProductName,
    bool HasVariants,
    List<ProductVariantOptionDto> Options,
    List<ProductVariantDto> Variants
);
