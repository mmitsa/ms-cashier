# Product Bundles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow store managers to create product bundles (groups of products sold at a custom price) that appear in POS alongside regular products and expand into component line items on invoices.

**Architecture:** Bundles are products with `IsBundle = true`. A new `BundleItem` join table links bundle → component products. Invoice items gain a `BundleParentId` self-reference for parent/child rendering. Three discount modes: fixed price, percentage, flat amount.

**Tech Stack:** .NET 8 / EF Core 8 / SQL Server / React + TypeScript + Zustand + TanStack Query

---

## File Map

### Backend — Create:
- `backend/MsCashier.Domain/Enums/BundleDiscountType.cs` — new enum
- `backend/MsCashier.Domain/Enums/BundlePricingMode.cs` — new enum
- `backend/MsCashier.Domain/Entities/BundleItem.cs` — new entity
- `backend/MsCashier.Infrastructure/Migrations/<timestamp>_AddProductBundles.cs` — EF migration

### Backend — Modify:
- `backend/MsCashier.Domain/Entities/Product.cs` — add bundle fields
- `backend/MsCashier.Domain/Entities/InvoiceItem.cs` — add BundleParentId
- `backend/MsCashier.Application/DTOs/Product.cs` — extend DTOs
- `backend/MsCashier.Application/DTOs/Invoice.cs` — extend InvoiceItemDto
- `backend/MsCashier.Application/Services/ProductService.cs` — bundle CRUD
- `backend/MsCashier.Application/Services/InvoiceService.cs` — bundle sale logic
- `backend/MsCashier.Infrastructure/Data/AppDbContext.cs` — BundleItem config + query filter

### Frontend — Modify:
- `frontend/src/types/api.types.ts` — add bundle types
- `frontend/src/store/posStore.ts` — bundle cart logic
- `frontend/src/features/pos/components/POSScreen.tsx` — bundle card + cart rendering

---

## Task 1: Backend Enums

**Files:**
- Create: `backend/MsCashier.Domain/Enums/BundleDiscountType.cs`
- Create: `backend/MsCashier.Domain/Enums/BundlePricingMode.cs`

- [ ] **Step 1: Create BundleDiscountType enum**

```csharp
// backend/MsCashier.Domain/Enums/BundleDiscountType.cs
namespace MsCashier.Domain.Enums;

public enum BundleDiscountType : byte
{
    FixedPrice = 1,
    Percent = 2,
    FlatDiscount = 3
}
```

- [ ] **Step 2: Create BundlePricingMode enum**

```csharp
// backend/MsCashier.Domain/Enums/BundlePricingMode.cs
namespace MsCashier.Domain.Enums;

public enum BundlePricingMode : byte
{
    Unified = 1,
    PerLevel = 2
}
```

- [ ] **Step 3: Build to verify**

Run: `cd backend && dotnet build`
Expected: Build succeeded.

- [ ] **Step 4: Commit**

```bash
git add backend/MsCashier.Domain/Enums/BundleDiscountType.cs backend/MsCashier.Domain/Enums/BundlePricingMode.cs
git commit -m "feat(bundles): add BundleDiscountType and BundlePricingMode enums"
```

---

## Task 2: BundleItem Entity + Product Entity Changes

**Files:**
- Create: `backend/MsCashier.Domain/Entities/BundleItem.cs`
- Modify: `backend/MsCashier.Domain/Entities/Product.cs`
- Modify: `backend/MsCashier.Domain/Entities/InvoiceItem.cs`

- [ ] **Step 1: Create BundleItem entity**

```csharp
// backend/MsCashier.Domain/Entities/BundleItem.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MsCashier.Domain.Entities;

public class BundleItem
{
    [Key]
    public int Id { get; set; }

    public Guid TenantId { get; set; }

    public int ProductId { get; set; }     // The bundle (parent)

    public int ComponentId { get; set; }   // The component product

    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    public int SortOrder { get; set; }

    // Navigation
    public Product? Product { get; set; }
    public Product? Component { get; set; }
}
```

- [ ] **Step 2: Add bundle fields to Product entity**

In `backend/MsCashier.Domain/Entities/Product.cs`, add before the `// Navigation` comment (before line 64):

```csharp
    // Bundle
    public bool IsBundle { get; set; } = false;

    public BundleDiscountType? BundleDiscountType { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? BundleDiscountValue { get; set; }

    public bool BundleHasOwnStock { get; set; } = false;

    public DateTime? BundleValidFrom { get; set; }
    public DateTime? BundleValidTo { get; set; }

    public BundlePricingMode BundlePricingMode { get; set; } = BundlePricingMode.Unified;
```

Also add to the Navigation section:

```csharp
    public ICollection<BundleItem> BundleItems { get; set; } = new List<BundleItem>();
```

Add the using at the top:

```csharp
using MsCashier.Domain.Enums;
```

- [ ] **Step 3: Add BundleParentId to InvoiceItem**

In `backend/MsCashier.Domain/Entities/InvoiceItem.cs`, add after the `Notes` property:

```csharp
    public long? BundleParentId { get; set; }

    // Navigation
    public InvoiceItem? BundleParent { get; set; }
    public ICollection<InvoiceItem> BundleChildren { get; set; } = new List<InvoiceItem>();
```

- [ ] **Step 4: Build to verify**

Run: `cd backend && dotnet build`
Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add backend/MsCashier.Domain/Entities/BundleItem.cs backend/MsCashier.Domain/Entities/Product.cs backend/MsCashier.Domain/Entities/InvoiceItem.cs
git commit -m "feat(bundles): add BundleItem entity, bundle fields on Product, BundleParentId on InvoiceItem"
```

---

## Task 3: AppDbContext Configuration + Migration

**Files:**
- Modify: `backend/MsCashier.Infrastructure/Data/AppDbContext.cs`

- [ ] **Step 1: Add DbSet for BundleItem**

After the existing `DbSet` declarations (around line 22), add:

```csharp
    public DbSet<BundleItem> BundleItems => Set<BundleItem>();
```

- [ ] **Step 2: Add BundleItem query filter**

After the Production & Kitchen query filters section (around line 146), add:

```csharp
        // Bundle items: tenant isolation
        modelBuilder.Entity<BundleItem>().HasQueryFilter(e => _tenantService == null || e.TenantId == _tenantService.TenantId);
```

- [ ] **Step 3: Add BundleItem entity configuration**

After the Product entity configuration section (around line 257), add:

```csharp
        // BundleItem
        modelBuilder.Entity<BundleItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.ProductId, x.ComponentId }).IsUnique();
            e.HasIndex(x => x.ProductId);
            e.Property(x => x.Quantity).HasPrecision(18, 2);
            e.HasOne(x => x.Product).WithMany(x => x.BundleItems).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Component).WithMany().HasForeignKey(x => x.ComponentId).OnDelete(DeleteBehavior.Restrict);
        });
```

- [ ] **Step 4: Add InvoiceItem self-reference configuration**

In the existing InvoiceItem configuration section (around line 343), add inside the entity block:

```csharp
            e.HasIndex(x => x.BundleParentId);
            e.HasOne(x => x.BundleParent).WithMany(x => x.BundleChildren).HasForeignKey(x => x.BundleParentId).OnDelete(DeleteBehavior.Restrict);
```

- [ ] **Step 5: Add Product bundle property configurations**

In the existing Product configuration section (around line 239), add inside the entity block:

```csharp
            e.Property(x => x.BundleDiscountValue).HasPrecision(18, 2);
            e.HasIndex(x => x.IsBundle);
```

- [ ] **Step 6: Create EF Core migration**

Run:
```bash
cd backend
dotnet ef migrations add AddProductBundles --project MsCashier.Infrastructure --startup-project MsCashier.API
```
Expected: Migration created successfully.

- [ ] **Step 7: Apply migration**

Run:
```bash
dotnet ef database update --project MsCashier.Infrastructure --startup-project MsCashier.API
```
Expected: Database updated successfully.

- [ ] **Step 8: Commit**

```bash
git add backend/MsCashier.Infrastructure/
git commit -m "feat(bundles): add BundleItem DbContext config, query filter, and migration"
```

---

## Task 4: DTOs

**Files:**
- Modify: `backend/MsCashier.Application/DTOs/Product.cs`
- Modify: `backend/MsCashier.Application/DTOs/Invoice.cs`

- [ ] **Step 1: Add bundle DTOs to Product.cs**

Replace the full file content of `backend/MsCashier.Application/DTOs/Product.cs`:

```csharp
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
```

- [ ] **Step 2: Add BundleParentId to InvoiceItemDto**

In `backend/MsCashier.Application/DTOs/Invoice.cs`, find the `InvoiceItemDto` record and add `long? BundleParentId` as the last parameter:

Replace the InvoiceItemDto line with:
```csharp
public record InvoiceItemDto(long Id, int ProductId, string ProductName, string? Barcode,
    decimal Quantity, string UnitName, decimal UnitPrice, decimal CostPrice,
    decimal DiscountAmount, decimal TaxAmount, decimal TotalPrice, long? BundleParentId = null);
```

- [ ] **Step 3: Build to verify**

Run: `cd backend && dotnet build`
Expected: Build succeeded (may show warnings about unused parameters — that's OK).

- [ ] **Step 4: Commit**

```bash
git add backend/MsCashier.Application/DTOs/
git commit -m "feat(bundles): extend Product and Invoice DTOs with bundle fields"
```

---

## Task 5: ProductService — Bundle CRUD Logic

**Files:**
- Modify: `backend/MsCashier.Application/Services/ProductService.cs`

- [ ] **Step 1: Update MapToDto to include bundle fields**

Find the `MapToDto` helper method in ProductService.cs and replace it with:

```csharp
    private static ProductDto MapToDto(Product p, decimal currentStock, List<BundleItemDto>? bundleItems = null) =>
        new(p.Id, p.Barcode, p.SKU, p.Name, p.Description,
            p.CategoryId, p.Category?.Name, p.UnitId, p.Unit?.Name,
            p.CostPrice, p.RetailPrice, p.HalfWholesalePrice, p.WholesalePrice, p.Price4,
            (int)p.MinStock, currentStock, p.IsActive, p.TaxRate, p.ImageUrl,
            p.IsBundle, p.BundleDiscountType, p.BundleDiscountValue, p.BundleHasOwnStock,
            p.BundleValidFrom, p.BundleValidTo, p.BundlePricingMode, bundleItems);
```

- [ ] **Step 2: Update CreateAsync to handle bundles**

In the `CreateAsync` method, after setting all existing product properties and before `await _uow.Repository<Product>().AddAsync(product);`, add the bundle fields:

```csharp
                IsBundle = request.IsBundle,
                BundleDiscountType = request.BundleDiscountType,
                BundleDiscountValue = request.BundleDiscountValue,
                BundleHasOwnStock = request.BundleHasOwnStock,
                BundleValidFrom = request.BundleValidFrom,
                BundleValidTo = request.BundleValidTo,
                BundlePricingMode = request.BundlePricingMode,
```

After `SaveChangesAsync` for the product, add bundle items saving:

```csharp
            // Save bundle items if this is a bundle
            if (request.IsBundle && request.BundleItems?.Count > 0)
            {
                // Validate: bundle needs at least 2 components
                if (request.BundleItems.Count < 2)
                    return Result<ProductDto>.Failure("الباقة يجب أن تحتوي على صنفين على الأقل");

                // Validate: no self-reference, no nested bundles
                var componentIds = request.BundleItems.Select(bi => bi.ComponentId).ToList();
                var components = await _uow.Repository<Product>().Query()
                    .Where(p => componentIds.Contains(p.Id))
                    .ToListAsync();

                if (components.Any(c => c.IsBundle))
                    return Result<ProductDto>.Failure("لا يمكن إضافة باقة داخل باقة أخرى");

                if (components.Count != componentIds.Count)
                    return Result<ProductDto>.Failure("بعض الأصناف المكونة غير موجودة");

                foreach (var bi in request.BundleItems)
                {
                    await _uow.Repository<BundleItem>().AddAsync(new BundleItem
                    {
                        TenantId = product.TenantId,
                        ProductId = product.Id,
                        ComponentId = bi.ComponentId,
                        Quantity = bi.Quantity,
                        SortOrder = bi.SortOrder,
                    });
                }
                await _uow.SaveChangesAsync();
            }
```

- [ ] **Step 3: Update GetAllAsync to include bundle items**

In the product listing method, after fetching products, load bundle items for bundle products:

```csharp
            // Load bundle items for bundle products
            var bundleProductIds = products.Where(p => p.IsBundle).Select(p => p.Id).ToList();
            var allBundleItems = bundleProductIds.Count > 0
                ? await _uow.Repository<BundleItem>().Query()
                    .Include(bi => bi.Component)
                    .Where(bi => bundleProductIds.Contains(bi.ProductId))
                    .OrderBy(bi => bi.SortOrder)
                    .ToListAsync()
                : new List<BundleItem>();

            var bundleItemsByProduct = allBundleItems
                .GroupBy(bi => bi.ProductId)
                .ToDictionary(g => g.Key, g => g.Select(bi => new BundleItemDto(
                    bi.Id, bi.ComponentId, bi.Component?.Name ?? "", bi.Component?.Barcode,
                    bi.Quantity, bi.SortOrder, bi.Component?.RetailPrice ?? 0, bi.Component?.CostPrice ?? 0
                )).ToList());
```

Then update the MapToDto calls to pass bundle items:

```csharp
            MapToDto(p, stock, bundleItemsByProduct.GetValueOrDefault(p.Id))
```

- [ ] **Step 4: Update product listing to filter expired bundles for POS**

In the products query, add the validity filter:

```csharp
            // Filter out expired bundles
            query = query.Where(p => !p.IsBundle
                || ((!p.BundleValidFrom.HasValue || p.BundleValidFrom <= DateTime.UtcNow)
                 && (!p.BundleValidTo.HasValue || p.BundleValidTo >= DateTime.UtcNow)));
```

- [ ] **Step 5: Build to verify**

Run: `cd backend && dotnet build`
Expected: Build succeeded.

- [ ] **Step 6: Commit**

```bash
git add backend/MsCashier.Application/Services/ProductService.cs
git commit -m "feat(bundles): add bundle CRUD logic to ProductService"
```

---

## Task 6: InvoiceService — Bundle Sale Logic

**Files:**
- Modify: `backend/MsCashier.Application/Services/InvoiceService.cs`

- [ ] **Step 1: Add bundle price calculation helper**

Add this private method to `InvoiceService`:

```csharp
    private static decimal CalcBundlePrice(Product bundle, List<BundleItem> items, PriceType priceType)
    {
        if (bundle.BundleDiscountType == Domain.Enums.BundleDiscountType.FixedPrice)
        {
            if (bundle.BundlePricingMode == BundlePricingMode.Unified)
                return bundle.RetailPrice;

            return priceType switch
            {
                PriceType.HalfWholesale => bundle.HalfWholesalePrice ?? bundle.RetailPrice,
                PriceType.Wholesale => bundle.WholesalePrice ?? bundle.RetailPrice,
                _ => bundle.RetailPrice,
            };
        }

        // Calculate component sum based on price type
        var componentSum = items.Sum(bi =>
        {
            var compPrice = priceType switch
            {
                PriceType.HalfWholesale => bi.Component?.HalfWholesalePrice ?? bi.Component?.RetailPrice ?? 0,
                PriceType.Wholesale => bi.Component?.WholesalePrice ?? bi.Component?.RetailPrice ?? 0,
                _ => bi.Component?.RetailPrice ?? 0,
            };
            return compPrice * bi.Quantity;
        });

        return bundle.BundleDiscountType switch
        {
            Domain.Enums.BundleDiscountType.Percent =>
                Math.Round(componentSum * (1 - (bundle.BundleDiscountValue ?? 0) / 100), 2),
            Domain.Enums.BundleDiscountType.FlatDiscount =>
                Math.Max(0, componentSum - (bundle.BundleDiscountValue ?? 0)),
            _ => componentSum,
        };
    }
```

- [ ] **Step 2: Update CreateSaleAsync to handle bundle items**

In `CreateSaleAsync`, inside the item processing loop (around line 99), before creating the InvoiceItem, add bundle detection:

```csharp
                // Check if this is a bundle product
                if (product.IsBundle)
                {
                    var bundleItems = await _uow.Repository<BundleItem>().Query()
                        .Include(bi => bi.Component)
                        .Where(bi => bi.ProductId == product.Id)
                        .OrderBy(bi => bi.SortOrder)
                        .ToListAsync();

                    var bundlePrice = CalcBundlePrice(product, bundleItems, request.PriceType);
                    var bundleCost = bundleItems.Sum(bi => (bi.Component?.CostPrice ?? 0) * bi.Quantity);
                    var lineTotal = bundlePrice * item.Quantity;
                    var lineTax = defaultVatRate > 0 ? Math.Round(lineTotal * defaultVatRate / 100, 2) : 0;

                    var parentItem = new InvoiceItem
                    {
                        ProductId = product.Id,
                        Quantity = item.Quantity,
                        UnitPrice = bundlePrice,
                        CostPrice = bundleCost,
                        DiscountAmount = item.DiscountAmount,
                        TaxAmount = lineTax,
                        TotalPrice = lineTotal - item.DiscountAmount + lineTax,
                        BundleParentId = null,
                    };
                    invoiceItems.Add(parentItem);
                    subTotal += lineTotal;
                    totalTax += lineTax;

                    // Add child items for each component (price = 0, for display/inventory)
                    foreach (var bi in bundleItems)
                    {
                        invoiceItems.Add(new InvoiceItem
                        {
                            ProductId = bi.ComponentId,
                            Quantity = bi.Quantity * item.Quantity,
                            UnitPrice = 0,
                            CostPrice = bi.Component?.CostPrice ?? 0,
                            DiscountAmount = 0,
                            TaxAmount = 0,
                            TotalPrice = 0,
                            BundleParentId = -1, // placeholder, updated after parent save
                        });
                    }

                    continue; // skip the normal item processing below
                }
```

- [ ] **Step 3: Update inventory deduction for bundles**

In the inventory deduction section of `CreateSaleAsync`, add bundle handling:

```csharp
                // Bundle inventory deduction
                if (product.IsBundle)
                {
                    if (product.BundleHasOwnStock)
                    {
                        // Deduct from bundle's own stock
                        // (same as regular product deduction)
                    }
                    else
                    {
                        // Deduct from each component's stock
                        var bundleItems = await _uow.Repository<BundleItem>().Query()
                            .Where(bi => bi.ProductId == product.Id)
                            .ToListAsync();

                        foreach (var bi in bundleItems)
                        {
                            var compInventory = await _uow.Repository<Inventory>().Query()
                                .FirstOrDefaultAsync(inv => inv.ProductId == bi.ComponentId && inv.WarehouseId == effectiveWarehouseId);

                            if (compInventory != null)
                            {
                                compInventory.Quantity -= bi.Quantity * invoiceItem.Quantity;
                                compInventory.LastUpdated = DateTime.UtcNow;
                                _uow.Repository<Inventory>().Update(compInventory);
                            }
                        }
                    }
                    continue;
                }
```

- [ ] **Step 4: Update InvoiceItem BundleParentId after save**

After saving invoice items, fix the placeholder BundleParentId values:

```csharp
            // Fix BundleParentId references (replace -1 placeholder with actual parent IDs)
            InvoiceItem? lastBundleParent = null;
            foreach (var ii in invoice.Items)
            {
                if (ii.BundleParentId == null && await _uow.Repository<Product>().Query().AnyAsync(p => p.Id == ii.ProductId && p.IsBundle))
                {
                    lastBundleParent = ii;
                }
                else if (ii.BundleParentId == -1 && lastBundleParent != null)
                {
                    ii.BundleParentId = lastBundleParent.Id;
                    _uow.Repository<InvoiceItem>().Update(ii);
                }
            }
            await _uow.SaveChangesAsync();
```

- [ ] **Step 5: Update MapToDto for InvoiceItemDto**

Find the InvoiceItem → InvoiceItemDto mapping and add BundleParentId:

```csharp
    new InvoiceItemDto(ii.Id, ii.ProductId, ii.Product?.Name ?? "", ii.Product?.Barcode,
        ii.Quantity, ii.Product?.Unit?.Name ?? "قطعة",
        ii.UnitPrice, ii.CostPrice, ii.DiscountAmount, ii.TaxAmount, ii.TotalPrice, ii.BundleParentId)
```

- [ ] **Step 6: Build to verify**

Run: `cd backend && dotnet build`
Expected: Build succeeded.

- [ ] **Step 7: Commit**

```bash
git add backend/MsCashier.Application/Services/InvoiceService.cs
git commit -m "feat(bundles): handle bundle sale in InvoiceService with price calc and inventory deduction"
```

---

## Task 7: Frontend Types

**Files:**
- Modify: `frontend/src/types/api.types.ts`

- [ ] **Step 1: Add bundle types and extend ProductDto**

At the end of the enums section, add:

```typescript
export type BundleDiscountType = 1 | 2 | 3;  // FixedPrice | Percent | FlatDiscount
export type BundlePricingMode = 1 | 2;        // Unified | PerLevel

export interface BundleItemDto {
  id: number;
  componentId: number;
  componentName: string;
  componentBarcode?: string;
  quantity: number;
  sortOrder: number;
  componentRetailPrice: number;
  componentCostPrice: number;
}
```

In the `ProductDto` interface, add at the end:

```typescript
  isBundle: boolean;
  bundleDiscountType?: BundleDiscountType;
  bundleDiscountValue?: number;
  bundleHasOwnStock: boolean;
  bundleValidFrom?: string;
  bundleValidTo?: string;
  bundlePricingMode: BundlePricingMode;
  bundleItems?: BundleItemDto[];
```

In `InvoiceItemDto`, add:

```typescript
  bundleParentId?: number;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/api.types.ts
git commit -m "feat(bundles): add bundle TypeScript types"
```

---

## Task 8: Frontend POS Store — Bundle Cart Logic

**Files:**
- Modify: `frontend/src/store/posStore.ts`

- [ ] **Step 1: Extend CartItem interface**

In `posStore.ts`, update the `CartItem` interface:

```typescript
export interface CartItem {
  product: ProductDto;
  quantity: number;
  unitPrice: number;
  discount: number;
  isBundleParent?: boolean;
  bundleChildren?: CartItem[];
}
```

- [ ] **Step 2: Add bundle price calculation helper**

Before the store creation, add:

```typescript
function calcBundlePrice(product: ProductDto, priceType: 'retail' | 'half' | 'wholesale'): number {
  if (!product.bundleItems?.length) return product.retailPrice;

  if (product.bundleDiscountType === 1) { // FixedPrice
    if (product.bundlePricingMode === 1) return product.retailPrice; // Unified
    return getPriceByType(product, priceType);
  }

  const componentSum = product.bundleItems.reduce((sum, bi) => {
    return sum + bi.componentRetailPrice * bi.quantity; // simplified — uses retail for calc
  }, 0);

  if (product.bundleDiscountType === 2) { // Percent
    return Math.round((componentSum * (1 - (product.bundleDiscountValue ?? 0) / 100)) * 100) / 100;
  }
  if (product.bundleDiscountType === 3) { // FlatDiscount
    return Math.max(0, componentSum - (product.bundleDiscountValue ?? 0));
  }

  return componentSum;
}
```

- [ ] **Step 3: Update addToCart for bundles**

In the `addToCart` action, wrap the existing logic with a bundle check:

```typescript
      addToCart: (product, price) => {
        if (product.isBundle && product.bundleItems?.length) {
          const bundlePrice = calcBundlePrice(product, get().priceType);
          set((state) => {
            const existing = state.cart.find((item) => item.product.id === product.id && item.isBundleParent);
            if (existing) {
              existing.quantity += 1;
            } else {
              const children: CartItem[] = product.bundleItems!.map((bi) => ({
                product: { id: bi.componentId, name: bi.componentName, barcode: bi.componentBarcode } as ProductDto,
                quantity: bi.quantity,
                unitPrice: 0,
                discount: 0,
              }));
              state.cart.push({
                product,
                quantity: 1,
                unitPrice: bundlePrice,
                discount: 0,
                isBundleParent: true,
                bundleChildren: children,
              });
            }
          });
          return;
        }

        // ... existing addToCart logic unchanged ...
```

- [ ] **Step 4: Update updateQuantity to sync bundle children**

After updating a bundle parent's quantity, multiply children:

```typescript
      updateQuantity: (productId, quantity) => {
        set((state) => {
          const item = state.cart.find((i) => i.product.id === productId);
          if (!item) return;
          if (quantity <= 0) {
            state.cart = state.cart.filter((i) => i.product.id !== productId);
            return;
          }
          item.quantity = quantity;
          // Sync bundle children quantities
          if (item.isBundleParent && item.bundleChildren) {
            const bundleItems = item.product.bundleItems ?? [];
            item.bundleChildren.forEach((child, idx) => {
              if (bundleItems[idx]) {
                child.quantity = bundleItems[idx].quantity * quantity;
              }
            });
          }
        });
      },
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/store/posStore.ts
git commit -m "feat(bundles): add bundle cart logic to posStore"
```

---

## Task 9: Frontend POS Screen — Bundle UI

**Files:**
- Modify: `frontend/src/features/pos/components/POSScreen.tsx`

- [ ] **Step 1: Add bundle badge to product cards**

In the product card rendering (around line 456-486), after the product image section, add a bundle badge:

```tsx
                    {product.isBundle && (
                      <div className="absolute top-1 right-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        باقة
                      </div>
                    )}
```

- [ ] **Step 2: Show bundle price with original sum strikethrough**

In the price display area of the product card, enhance for bundles:

```tsx
                    {product.isBundle && product.bundleItems?.length ? (
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-brand-600 dark:text-brand-400">
                          {formatCurrency(calcBundlePrice(product, priceType))}
                        </span>
                        <span className="text-[10px] text-gray-400 line-through">
                          {formatCurrency(product.bundleItems.reduce((s, bi) => s + bi.componentRetailPrice * bi.quantity, 0))}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {formatCurrency(displayPrice)}
                      </span>
                    )}
```

Import `calcBundlePrice` from the posStore or define it locally.

- [ ] **Step 3: Render bundle children in cart**

In the cart items rendering section (around line 590-658), after each cart item, render bundle children:

```tsx
                {item.isBundleParent && item.bundleChildren?.map((child, idx) => (
                  <div key={`bundle-child-${item.product.id}-${idx}`}
                    className="flex items-center gap-2 px-2.5 py-1 mr-4 border-r-2 border-purple-300 dark:border-purple-700">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {idx === item.bundleChildren!.length - 1 ? '└' : '├'} {child.product.name} × {child.quantity}
                    </span>
                  </div>
                ))}
```

- [ ] **Step 4: Add bundle icon to cart parent items**

In the cart item name display, add a gift icon for bundles:

```tsx
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                    {item.isBundleParent && <span className="text-purple-500 ml-1">🎁</span>}
                    {item.product.name}
                  </p>
```

- [ ] **Step 5: Update sale submission to handle bundle items**

In the `handleSale` function where `CreateInvoiceRequest` items are built, expand bundle items:

```typescript
        const invoiceItems: InvoiceItemRequest[] = [];
        for (const item of cart) {
          invoiceItems.push({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discount,
          });
          // Backend handles bundle expansion — no extra work needed here
        }
```

- [ ] **Step 6: Build and verify**

Run: `cd frontend && npm run build`
Expected: Build succeeded with no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/pos/components/POSScreen.tsx
git commit -m "feat(bundles): add bundle UI to POS product cards and cart"
```

---

## Task 10: Docker Rebuild + Verify

- [ ] **Step 1: Rebuild and restart all containers**

```bash
cd "/Volumes/Projects/mmit pos"
docker compose build api frontend
docker start mscashier-db && sleep 5
docker start mscashier-migrate && sleep 10
docker start mscashier-api mscashier-frontend
```

- [ ] **Step 2: Test bundle creation via API**

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:5050/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Adm6134584e7ac1@12"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Create a bundle product
curl -s -X POST http://localhost:5050/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "باقة العائلة",
    "barcode": "BUNDLE001",
    "retailPrice": 14,
    "costPrice": 10,
    "minStock": 0,
    "initialStock": 0,
    "warehouseId": 1,
    "isBundle": true,
    "bundleDiscountType": 1,
    "bundleDiscountValue": 14,
    "bundlePricingMode": 1,
    "bundleItems": [
      {"componentId": 1, "quantity": 2, "sortOrder": 1},
      {"componentId": 2, "quantity": 1, "sortOrder": 2},
      {"componentId": 3, "quantity": 1, "sortOrder": 3}
    ]
  }'
```

Expected: `{"success": true, "data": {..., "isBundle": true, "bundleItems": [...]}}`

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000`, login as cashier, verify the bundle appears with a purple "باقة" badge. Click the bundle to add to cart and verify children appear.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(bundles): product bundles feature complete — bundle creation, POS display, cart logic, invoice expansion"
```
