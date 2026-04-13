# Product Bundles (Bags) — Design Spec

**Date:** 2026-04-13
**Status:** Approved
**Approach:** Bundle as a special Product (`IsBundle = true`) + `BundleItem` table

---

## 1. Overview

Allow store managers to create product bundles — a group of existing products sold together at a custom price (fixed price, percentage discount, or flat discount). Bundles appear alongside regular products in the POS screen and are sold as a single unit that expands into component line items on the invoice.

### Key Decisions

| Decision | Choice |
|----------|--------|
| Architecture | Bundle = Product with `IsBundle` flag |
| Inventory | Configurable: own stock OR deduct from components |
| Invoice display | Parent line + child lines (`BundleParentId`) |
| Discount types | Fixed price, % discount, flat amount discount |
| Price levels | Unified OR per-level (retail/half/wholesale) |
| Validity | Permanent OR time-bound (from/to dates) |

---

## 2. Database Changes

### 2.1 Alter `Products` table — add columns:

```sql
ALTER TABLE Products ADD
    IsBundle            BIT           NOT NULL DEFAULT 0,
    BundleDiscountType  TINYINT       NULL,      -- 1=FixedPrice, 2=Percent, 3=FlatDiscount
    BundleDiscountValue DECIMAL(18,2) NULL,      -- The value (price/percent/amount)
    BundleHasOwnStock   BIT           NOT NULL DEFAULT 0,
    BundleValidFrom     DATETIME2     NULL,      -- NULL = always valid
    BundleValidTo       DATETIME2     NULL,      -- NULL = never expires
    BundlePricingMode   TINYINT       NOT NULL DEFAULT 1;  -- 1=Unified, 2=PerLevel
```

**BundleDiscountType enum:**
- `1` = Fixed price (BundleDiscountValue = the total bundle price)
- `2` = Percentage discount (BundleDiscountValue = % off component sum)
- `3` = Flat discount (BundleDiscountValue = amount off component sum)

**BundlePricingMode enum:**
- `1` = Unified — uses `RetailPrice` as bundle price for all levels (ignores HalfWholesale/Wholesale). Only relevant when `BundleDiscountType = 1`.
- `2` = Per-level — uses `RetailPrice`, `HalfWholesalePrice`, `WholesalePrice` individually. For discount types 2/3, applies the discount to each level's component sum separately.

### 2.2 New `BundleItems` table:

```sql
CREATE TABLE BundleItems (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    TenantId    UNIQUEIDENTIFIER NOT NULL,
    ProductId   INT NOT NULL,           -- FK → Products.Id (the bundle)
    ComponentId INT NOT NULL,           -- FK → Products.Id (the component product)
    Quantity    DECIMAL(18,2) NOT NULL, -- qty of this component per 1 bundle
    SortOrder   INT NOT NULL DEFAULT 0,
    
    CONSTRAINT FK_BundleItems_Product FOREIGN KEY (ProductId) REFERENCES Products(Id),
    CONSTRAINT FK_BundleItems_Component FOREIGN KEY (ComponentId) REFERENCES Products(Id),
    CONSTRAINT UQ_BundleItems_Unique UNIQUE (TenantId, ProductId, ComponentId)
);
```

**Query filter:** `TenantId == currentTenant` (same pattern as other tenant entities).

**Constraints:**
- A bundle cannot contain itself (`ProductId != ComponentId`)
- A bundle cannot contain another bundle (validated in service layer)
- Component must be an active, non-deleted product

### 2.3 Alter `InvoiceItems` table — add column:

```sql
ALTER TABLE InvoiceItems ADD
    BundleParentId BIGINT NULL;  -- FK → InvoiceItems.Id (self-referencing)
```

- `NULL` = regular item or bundle parent line
- Non-null = child line belonging to the bundle parent

---

## 3. Backend Entity Changes

### 3.1 Product entity — add properties:

```csharp
// Bundle properties
public bool IsBundle { get; set; } = false;
public BundleDiscountType? BundleDiscountType { get; set; }
public decimal? BundleDiscountValue { get; set; }
public bool BundleHasOwnStock { get; set; } = false;
public DateTime? BundleValidFrom { get; set; }
public DateTime? BundleValidTo { get; set; }
public BundlePricingMode BundlePricingMode { get; set; } = BundlePricingMode.Unified;

// Navigation
public ICollection<BundleItem> BundleItems { get; set; } = new List<BundleItem>();
```

### 3.2 New BundleItem entity:

```csharp
public class BundleItem
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int ProductId { get; set; }      // The bundle
    public int ComponentId { get; set; }    // The component
    public decimal Quantity { get; set; }
    public int SortOrder { get; set; }

    // Navigation
    public Product? Product { get; set; }
    public Product? Component { get; set; }
}
```

### 3.3 New enums:

```csharp
public enum BundleDiscountType : byte { FixedPrice = 1, Percent = 2, FlatDiscount = 3 }
public enum BundlePricingMode : byte { Unified = 1, PerLevel = 2 }
```

### 3.4 InvoiceItem — add property:

```csharp
public long? BundleParentId { get; set; }
public InvoiceItem? BundleParent { get; set; }
public ICollection<InvoiceItem> BundleChildren { get; set; } = new List<InvoiceItem>();
```

---

## 4. Backend Service Logic

### 4.1 Bundle Price Calculation

```
CalcBundlePrice(bundle, priceType):

  IF BundleDiscountType == FixedPrice:
    IF BundlePricingMode == Unified:
      RETURN bundle.RetailPrice
    ELSE (PerLevel):
      RETURN getPriceByType(bundle, priceType)  // existing helper

  componentSum = SUM(component.getPriceByType(priceType) * bundleItem.Quantity)
                 FOR EACH bundleItem IN bundle.BundleItems

  IF BundleDiscountType == Percent:
    RETURN componentSum * (1 - BundleDiscountValue / 100)

  IF BundleDiscountType == FlatDiscount:
    RETURN componentSum - BundleDiscountValue
```

### 4.2 Invoice Creation — Bundle Handling

In `InvoiceService.CreateSaleAsync`, when processing an item where `product.IsBundle == true`:

**Step 1:** Validate bundle is active and within validity dates.

**Step 2:** Calculate bundle price using `CalcBundlePrice()`.

**Step 3:** Create parent InvoiceItem:
```csharp
var parentItem = new InvoiceItem {
    ProductId = bundle.Id,
    Quantity = requestedQty,
    UnitPrice = bundlePrice,
    CostPrice = componentCostSum,  // sum of component costs
    DiscountAmount = 0,
    TaxAmount = calculatedTax,
    TotalPrice = bundlePrice * requestedQty + tax,
    BundleParentId = null
};
```

**Step 4:** Create child InvoiceItems (for each component):
```csharp
foreach (var comp in bundle.BundleItems) {
    var childItem = new InvoiceItem {
        ProductId = comp.ComponentId,
        Quantity = comp.Quantity * requestedQty,
        UnitPrice = 0,          // price is on parent
        CostPrice = comp.Component.CostPrice,
        DiscountAmount = 0,
        TaxAmount = 0,          // tax is on parent
        TotalPrice = 0,         // price is on parent
        BundleParentId = parentItem.Id
    };
}
```

**Step 5:** Inventory deduction:
```
IF bundle.BundleHasOwnStock:
    deduct(bundle.Id, warehouseId, requestedQty)
ELSE:
    FOR EACH component IN bundle.BundleItems:
        deduct(component.ComponentId, warehouseId, component.Quantity * requestedQty)
```

### 4.3 Bundle Validity Filter

In `ProductService.GetAllAsync` (product listing), add:
```csharp
.Where(p => !p.IsBundle
    || ((!p.BundleValidFrom.HasValue || p.BundleValidFrom <= DateTime.UtcNow)
     && (!p.BundleValidTo.HasValue || p.BundleValidTo >= DateTime.UtcNow)))
```

### 4.4 Bundle Stock Availability

In `ProductService` or a new helper, for bundles without own stock:
```
GetBundleAvailableQty(bundle, warehouseId):
    RETURN MIN(
        component.availableQty / bundleItem.Quantity
        FOR EACH bundleItem IN bundle.BundleItems
    )
```

---

## 5. DTO Changes

### 5.1 ProductDto — add fields:

```csharp
bool IsBundle,
BundleDiscountType? BundleDiscountType,
decimal? BundleDiscountValue,
bool BundleHasOwnStock,
DateTime? BundleValidFrom,
DateTime? BundleValidTo,
BundlePricingMode BundlePricingMode,
List<BundleItemDto>? BundleItems    // null for non-bundles
```

### 5.2 New BundleItemDto:

```csharp
public record BundleItemDto(
    int Id, int ComponentId, string ComponentName,
    string? ComponentBarcode, decimal Quantity, int SortOrder,
    decimal ComponentRetailPrice);
```

### 5.3 CreateProductRequest — add fields:

```csharp
bool IsBundle = false,
BundleDiscountType? BundleDiscountType = null,
decimal? BundleDiscountValue = null,
bool BundleHasOwnStock = false,
DateTime? BundleValidFrom = null,
DateTime? BundleValidTo = null,
BundlePricingMode BundlePricingMode = BundlePricingMode.Unified,
List<BundleItemRequest>? BundleItems = null
```

### 5.4 New BundleItemRequest:

```csharp
public record BundleItemRequest(int ComponentId, decimal Quantity, int SortOrder = 0);
```

### 5.5 InvoiceItemDto — add field:

```csharp
long? BundleParentId
```

---

## 6. Frontend Changes

### 6.1 Product Management (Admin) — Edit product form

When `IsBundle` checkbox is toggled ON, show bundle configuration section:

- **Components table:** Search/select products, set quantity, reorder, delete
- **Discount type:** Radio group (Fixed price / % / Flat amount)
- **Discount value:** Number input
- **Pricing mode:** Radio (Unified / Per-level)
- **Own stock:** Checkbox
- **Validity:** Optional date range picker

### 6.2 POSScreen — Product Grid

- Bundle products show a **"باقة"** badge (purple/gradient) on the card
- Bundle card shows the bundle price + original component sum (strikethrough)
- Expired bundles are hidden automatically (API filters them)
- Available quantity: shows calculated qty based on component stock (or own stock)

### 6.3 POSScreen — Cart

Bundle in cart renders as:
```
🎁 باقة العائلة                × 1    14.00 ر.س
   ├ بيبسي 330مل × 2
   ├ شيبس ليز × 1
   └ شوكولاتة × 1
```

- Parent line: bold, full price, quantity controls (+/-)
- Child lines: indented, gray text, smaller font, NO controls
- Deleting bundle removes all children
- Quantity change on parent multiplies all children

### 6.4 posStore.ts — Cart State

```typescript
interface CartItem {
    product: ProductDto;
    quantity: number;
    unitPrice: number;
    discount: number;
    isBundleParent?: boolean;       // NEW
    bundleChildren?: CartItem[];    // NEW — component items
}
```

`addToCart(product)` logic:
```
IF product.isBundle:
    calculate bundlePrice using product.bundleDiscountType/Value
    add parent CartItem with isBundleParent=true, unitPrice=bundlePrice
    add bundleChildren from product.bundleItems (unitPrice=0)
ELSE:
    existing logic (unchanged)
```

### 6.5 TypeScript Types

```typescript
// api.types.ts additions
export type BundleDiscountType = 1 | 2 | 3;   // FixedPrice | Percent | FlatDiscount
export type BundlePricingMode = 1 | 2;         // Unified | PerLevel

export interface BundleItemDto {
    id: number;
    componentId: number;
    componentName: string;
    componentBarcode?: string;
    quantity: number;
    sortOrder: number;
    componentRetailPrice: number;
}
```

---

## 7. Validation Rules

| Rule | Where |
|------|-------|
| Bundle must have ≥ 2 components | ProductService (create/update) |
| Bundle cannot contain itself | ProductService |
| Bundle cannot contain another bundle | ProductService |
| Components must be active, non-deleted | ProductService |
| BundleDiscountValue required when IsBundle | ProductService |
| DiscountType=Percent: value must be 1-99 | ProductService |
| DiscountType=FlatDiscount: value < component sum | ProductService |
| ValidFrom < ValidTo when both set | ProductService |
| Stock check before sale (own or components) | InvoiceService |

---

## 8. Migration Plan

Single EF Core migration:
1. Add columns to `Products` table
2. Create `BundleItems` table with FKs and indexes
3. Add `BundleParentId` column to `InvoiceItems` table
4. Add query filter on `BundleItems` for tenant isolation

No data migration needed — all existing products get `IsBundle = false` by default.

---

## 9. Out of Scope

- Nested bundles (bundle containing a bundle)
- Bundle-specific promotions/coupons beyond the 3 discount types
- Bundle analytics/reporting dashboard (can be added later)
- Bundle images distinct from product images (uses same ImageUrl field)
