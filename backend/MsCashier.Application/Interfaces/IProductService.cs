using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IProductService
{
    Task<Result<ProductDto>> CreateAsync(CreateProductRequest request);
    Task<Result<PagedResult<ProductDto>>> SearchAsync(ProductSearchRequest request);
    Task<Result<ProductDto>> GetByIdAsync(int id);
    Task<Result<ProductDto>> GetByBarcodeAsync(string barcode);
    Task<Result<ProductDto>> UpdateAsync(int id, UpdateProductRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<List<LowStockProductDto>>> GetLowStockAsync();
    Task<Result<int>> BulkUpdateAsync(BulkUpdateProductsRequest request);
    Task<Result<int>> BulkDeleteAsync(BulkDeleteProductsRequest request);
    Task<Result<ProductDto>> UpdateBarcodeAsync(int id, string barcode);
    Task<Result<ProductDto>> UpdatePricesAsync(int id, UpdatePricesRequest request);
}

