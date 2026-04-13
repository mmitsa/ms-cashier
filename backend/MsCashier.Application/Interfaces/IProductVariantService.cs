using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IProductVariantService
{
    Task<Result<ProductWithVariantsDto>> GetProductVariantsAsync(int productId);
    Task<Result<List<ProductVariantOptionDto>>> SetVariantOptionsAsync(CreateVariantOptionsRequest request);
    Task<Result<List<ProductVariantDto>>> GenerateVariantsAsync(GenerateVariantsRequest request);
    Task<Result<ProductVariantDto>> UpdateVariantAsync(int variantId, UpdateVariantRequest request);
    Task<Result<bool>> DeleteVariantAsync(int variantId);
    Task<Result<ProductVariantDto>> GetVariantByBarcodeAsync(string barcode);
}
