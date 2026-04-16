using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Product
public record ProductDto(int Id, string? Barcode, string? SKU, string Name, string? Description,
    int? CategoryId, string? CategoryName, int? UnitId, string? UnitName, decimal CostPrice,
    decimal RetailPrice, decimal? HalfWholesalePrice, decimal? WholesalePrice, decimal? Price4,
    int MinStock, decimal CurrentStock, bool IsActive, decimal? TaxRate, string? ImageUrl,
    bool IsBundle = false, BundleDiscountType? BundleDiscountType = null,
    decimal? BundleDiscountValue = null, bool BundleHasOwnStock = false,
    DateTime? BundleValidFrom = null, DateTime? BundleValidTo = null,
    BundlePricingMode BundlePricingMode = BundlePricingMode.Unified,
    List<BundleItemDto>? BundleItems = null);

public record CreateProductRequest(string? Barcode, string? SKU, string Name, string? Description,
    int? CategoryId, int? UnitId, decimal CostPrice, decimal RetailPrice,
    decimal? HalfWholesalePrice, decimal? WholesalePrice, decimal? Price4,
    int MinStock, int? MaxStock, decimal? TaxRate, decimal InitialStock, int WarehouseId,
    bool IsBundle = false, BundleDiscountType? BundleDiscountType = null,
    decimal? BundleDiscountValue = null, bool BundleHasOwnStock = false,
    DateTime? BundleValidFrom = null, DateTime? BundleValidTo = null,
    BundlePricingMode BundlePricingMode = BundlePricingMode.Unified,
    List<BundleItemRequest>? BundleItems = null);

public record UpdateProductRequest(string? Barcode, string Name, string? Description,
    int? CategoryId, int? UnitId, decimal CostPrice, decimal RetailPrice,
    decimal? HalfWholesalePrice, decimal? WholesalePrice, decimal? Price4,
    int MinStock, decimal? TaxRate,
    bool IsBundle = false, BundleDiscountType? BundleDiscountType = null,
    decimal? BundleDiscountValue = null, bool BundleHasOwnStock = false,
    DateTime? BundleValidFrom = null, DateTime? BundleValidTo = null,
    BundlePricingMode BundlePricingMode = BundlePricingMode.Unified,
    List<BundleItemRequest>? BundleItems = null);

public record ProductSearchRequest(string? SearchTerm, int? CategoryId, bool? LowStockOnly,
    bool? ActiveOnly, int Page = 1, int PageSize = 50);

// Bundle
public record BundleItemDto(int Id, int ComponentId, string ComponentName, string? ComponentBarcode,
    decimal Quantity, int SortOrder, decimal ComponentRetailPrice, decimal ComponentCostPrice);

public record BundleItemRequest(int ComponentId, decimal Quantity, int SortOrder = 0);

// Bulk & Inline operations
public record BulkUpdateProductsRequest(IReadOnlyList<int> ProductIds, decimal? CostPrice = null, decimal? RetailPrice = null, int? CategoryId = null, bool? IsActive = null);
public record BulkDeleteProductsRequest(IReadOnlyList<int> ProductIds);
public record UpdateBarcodeRequest(string Barcode);
public record UpdatePricesRequest(decimal? CostPrice = null, decimal? RetailPrice = null);
