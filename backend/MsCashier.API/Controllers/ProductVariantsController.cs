using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

[Route("api/v1/product-variants")]
[Authorize]
public class ProductVariantsController : BaseApiController
{
    private readonly IProductVariantService _variantService;

    public ProductVariantsController(IProductVariantService variantService) => _variantService = variantService;

    [HttpGet("{productId:int}")]
    public async Task<IActionResult> GetProductVariants(int productId)
        => HandleResult(await _variantService.GetProductVariantsAsync(productId));

    [HttpPost("options")]
    public async Task<IActionResult> SetVariantOptions([FromBody] CreateVariantOptionsRequest request)
        => HandleResult(await _variantService.SetVariantOptionsAsync(request));

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateVariants([FromBody] GenerateVariantsRequest request)
        => HandleResult(await _variantService.GenerateVariantsAsync(request));

    [HttpPut("{variantId:int}")]
    public async Task<IActionResult> UpdateVariant(int variantId, [FromBody] UpdateVariantRequest request)
        => HandleResult(await _variantService.UpdateVariantAsync(variantId, request));

    [HttpDelete("{variantId:int}")]
    public async Task<IActionResult> DeleteVariant(int variantId)
        => HandleResult(await _variantService.DeleteVariantAsync(variantId));

    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode)
        => HandleResult(await _variantService.GetVariantByBarcodeAsync(barcode));
}
