using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Product
public record ProductDto(int Id, string? Barcode, string? SKU, string Name, string? Description, int? CategoryId, string? CategoryName, int? UnitId, string? UnitName, decimal CostPrice, decimal RetailPrice, decimal? HalfWholesalePrice, decimal? WholesalePrice, decimal? Price4, int MinStock, decimal CurrentStock, bool IsActive, decimal? TaxRate, string? ImageUrl);
public record CreateProductRequest(string? Barcode, string? SKU, string Name, string? Description, int? CategoryId, int? UnitId, decimal CostPrice, decimal RetailPrice, decimal? HalfWholesalePrice, decimal? WholesalePrice, decimal? Price4, int MinStock, int? MaxStock, decimal? TaxRate, decimal InitialStock, int WarehouseId);
public record UpdateProductRequest(string? Barcode, string Name, string? Description, int? CategoryId, int? UnitId, decimal CostPrice, decimal RetailPrice, decimal? HalfWholesalePrice, decimal? WholesalePrice, decimal? Price4, int MinStock, decimal? TaxRate);
public record ProductSearchRequest(string? SearchTerm, int? CategoryId, bool? LowStockOnly, bool? ActiveOnly, int Page = 1, int PageSize = 50);

