using System.Text.Json;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

public class ProductVariantService : IProductVariantService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public ProductVariantService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<ProductWithVariantsDto>> GetProductVariantsAsync(int productId)
    {
        var product = await _uow.Repository<Product>().Query()
            .Where(p => p.Id == productId && !p.IsDeleted)
            .FirstOrDefaultAsync();

        if (product == null)
            return Result<ProductWithVariantsDto>.Failure("المنتج غير موجود");

        var options = await _uow.Repository<ProductVariantOption>().Query()
            .Where(o => o.ProductId == productId && !o.IsDeleted)
            .Include(o => o.Values.Where(v => !v.IsDeleted))
            .OrderBy(o => o.SortOrder)
            .ToListAsync();

        var variants = await _uow.Repository<ProductVariant>().Query()
            .Where(v => v.ProductId == productId && !v.IsDeleted)
            .Include(v => v.InventoryItems)
            .ToListAsync();

        var optionDtos = options.Select(o => new ProductVariantOptionDto(
            o.Id, o.ProductId, o.Name, o.SortOrder,
            o.Values.OrderBy(v => v.SortOrder).Select(v => new ProductVariantValueDto(v.Id, v.VariantOptionId, v.Value, v.SortOrder)).ToList()
        )).ToList();

        var variantDtos = variants.Select(v => new ProductVariantDto(
            v.Id, v.ProductId, v.Sku, v.Barcode, v.VariantCombination, v.DisplayName,
            v.CostPrice, v.RetailPrice, v.HalfWholesalePrice, v.WholesalePrice,
            v.ImageUrl, v.IsActive,
            v.InventoryItems.Sum(i => i.Quantity)
        )).ToList();

        return Result<ProductWithVariantsDto>.Success(new ProductWithVariantsDto(
            productId, product.Name, product.HasVariants, optionDtos, variantDtos
        ));
    }

    public async Task<Result<List<ProductVariantOptionDto>>> SetVariantOptionsAsync(CreateVariantOptionsRequest request)
    {
        var product = await _uow.Repository<Product>().Query()
            .Where(p => p.Id == request.ProductId && !p.IsDeleted)
            .FirstOrDefaultAsync();

        if (product == null)
            return Result<List<ProductVariantOptionDto>>.Failure("المنتج غير موجود");

        // Remove old options
        var oldOptions = await _uow.Repository<ProductVariantOption>().Query()
            .Where(o => o.ProductId == request.ProductId && !o.IsDeleted)
            .Include(o => o.Values)
            .ToListAsync();

        foreach (var opt in oldOptions)
        {
            foreach (var val in opt.Values) val.IsDeleted = true;
            opt.IsDeleted = true;
        }

        // Create new options
        var newOptions = new List<ProductVariantOption>();
        for (int i = 0; i < request.Options.Count; i++)
        {
            var input = request.Options[i];
            var option = new ProductVariantOption
            {
                TenantId = _tenant.TenantId,
                ProductId = request.ProductId,
                Name = input.Name.Trim(),
                SortOrder = i,
            };

            for (int j = 0; j < input.Values.Count; j++)
            {
                option.Values.Add(new ProductVariantValue
                {
                    TenantId = _tenant.TenantId,
                    Value = input.Values[j].Trim(),
                    SortOrder = j,
                });
            }

            await _uow.Repository<ProductVariantOption>().AddAsync(option);
            newOptions.Add(option);
        }

        product.HasVariants = request.Options.Count > 0;
        _uow.Repository<Product>().Update(product);
        await _uow.SaveChangesAsync();

        return Result<List<ProductVariantOptionDto>>.Success(
            newOptions.Select(o => new ProductVariantOptionDto(
                o.Id, o.ProductId, o.Name, o.SortOrder,
                o.Values.Select(v => new ProductVariantValueDto(v.Id, o.Id, v.Value, v.SortOrder)).ToList()
            )).ToList()
        );
    }

    public async Task<Result<List<ProductVariantDto>>> GenerateVariantsAsync(GenerateVariantsRequest request)
    {
        var options = await _uow.Repository<ProductVariantOption>().Query()
            .Where(o => o.ProductId == request.ProductId && !o.IsDeleted)
            .Include(o => o.Values.Where(v => !v.IsDeleted))
            .OrderBy(o => o.SortOrder)
            .ToListAsync();

        if (options.Count == 0)
            return Result<List<ProductVariantDto>>.Failure("لا توجد خيارات متغيرات لهذا المنتج");

        // Remove old variants
        var oldVariants = await _uow.Repository<ProductVariant>().Query()
            .Where(v => v.ProductId == request.ProductId && !v.IsDeleted)
            .ToListAsync();
        foreach (var v in oldVariants) v.IsDeleted = true;

        // Generate Cartesian product of all option values
        var valueLists = options.Select(o => o.Values.OrderBy(v => v.SortOrder).ToList()).ToList();
        var combinations = CartesianProduct(valueLists);

        var newVariants = new List<ProductVariant>();
        foreach (var combo in combinations)
        {
            var dict = new Dictionary<string, string>();
            var displayParts = new List<string>();
            for (int i = 0; i < options.Count; i++)
            {
                dict[options[i].Name] = combo[i].Value;
                displayParts.Add(combo[i].Value);
            }

            var variant = new ProductVariant
            {
                TenantId = _tenant.TenantId,
                ProductId = request.ProductId,
                VariantCombination = JsonSerializer.Serialize(dict),
                DisplayName = string.Join(" / ", displayParts),
                CostPrice = request.DefaultCostPrice,
                RetailPrice = request.DefaultRetailPrice,
                HalfWholesalePrice = request.DefaultHalfWholesalePrice,
                WholesalePrice = request.DefaultWholesalePrice,
                IsActive = true,
            };

            await _uow.Repository<ProductVariant>().AddAsync(variant);
            newVariants.Add(variant);
        }

        await _uow.SaveChangesAsync();

        return Result<List<ProductVariantDto>>.Success(
            newVariants.Select(v => new ProductVariantDto(
                v.Id, v.ProductId, v.Sku, v.Barcode, v.VariantCombination, v.DisplayName,
                v.CostPrice, v.RetailPrice, v.HalfWholesalePrice, v.WholesalePrice,
                v.ImageUrl, v.IsActive, 0
            )).ToList()
        );
    }

    public async Task<Result<ProductVariantDto>> UpdateVariantAsync(int variantId, UpdateVariantRequest request)
    {
        var variant = await _uow.Repository<ProductVariant>().Query()
            .Where(v => v.Id == variantId && !v.IsDeleted)
            .Include(v => v.InventoryItems)
            .FirstOrDefaultAsync();

        if (variant == null)
            return Result<ProductVariantDto>.Failure("المتغير غير موجود");

        variant.Sku = request.Sku?.Trim();
        variant.Barcode = request.Barcode?.Trim();
        variant.CostPrice = request.CostPrice;
        variant.RetailPrice = request.RetailPrice;
        variant.HalfWholesalePrice = request.HalfWholesalePrice;
        variant.WholesalePrice = request.WholesalePrice;
        variant.ImageUrl = request.ImageUrl?.Trim();
        variant.IsActive = request.IsActive;
        variant.UpdatedAt = DateTime.UtcNow;

        _uow.Repository<ProductVariant>().Update(variant);
        await _uow.SaveChangesAsync();

        return Result<ProductVariantDto>.Success(new ProductVariantDto(
            variant.Id, variant.ProductId, variant.Sku, variant.Barcode,
            variant.VariantCombination, variant.DisplayName,
            variant.CostPrice, variant.RetailPrice, variant.HalfWholesalePrice, variant.WholesalePrice,
            variant.ImageUrl, variant.IsActive,
            variant.InventoryItems.Sum(i => i.Quantity)
        ));
    }

    public async Task<Result<bool>> DeleteVariantAsync(int variantId)
    {
        var variant = await _uow.Repository<ProductVariant>().GetByIdAsync(variantId);
        if (variant == null) return Result<bool>.Failure("المتغير غير موجود");

        variant.IsDeleted = true;
        variant.UpdatedAt = DateTime.UtcNow;
        _uow.Repository<ProductVariant>().Update(variant);
        await _uow.SaveChangesAsync();

        return Result<bool>.Success(true);
    }

    public async Task<Result<ProductVariantDto>> GetVariantByBarcodeAsync(string barcode)
    {
        var variant = await _uow.Repository<ProductVariant>().Query()
            .Where(v => v.Barcode == barcode && !v.IsDeleted)
            .Include(v => v.InventoryItems)
            .Include(v => v.Product)
            .FirstOrDefaultAsync();

        if (variant == null)
            return Result<ProductVariantDto>.Failure("المتغير غير موجود");

        return Result<ProductVariantDto>.Success(new ProductVariantDto(
            variant.Id, variant.ProductId, variant.Sku, variant.Barcode,
            variant.VariantCombination, variant.DisplayName,
            variant.CostPrice, variant.RetailPrice, variant.HalfWholesalePrice, variant.WholesalePrice,
            variant.ImageUrl, variant.IsActive,
            variant.InventoryItems.Sum(i => i.Quantity)
        ));
    }

    private static List<List<ProductVariantValue>> CartesianProduct(List<List<ProductVariantValue>> lists)
    {
        var result = new List<List<ProductVariantValue>> { new() };

        foreach (var list in lists)
        {
            var temp = new List<List<ProductVariantValue>>();
            foreach (var existing in result)
            {
                foreach (var item in list)
                {
                    var newList = new List<ProductVariantValue>(existing) { item };
                    temp.Add(newList);
                }
            }
            result = temp;
        }

        return result;
    }
}
