# خطة تنفيذ MPOS — خارطة الطريق الشاملة

> تاريخ الإنشاء: 2026-04-13
> الهدف: سد جميع الفجوات مع Loyverse + ميزات حصرية متقدمة

---

## نظرة عامة على المراحل

```
المرحلة 1: الأساسيات والبنية التحتية (4-6 أسابيع)
المرحلة 2: تجربة المستخدم والولاء (3-4 أسابيع)
المرحلة 3: المتجر الإلكتروني لكل مستأجر (6-8 أسابيع)
المرحلة 4: التواصل الاجتماعي والتسويق (3-4 أسابيع)
المرحلة 5: RFID + QR للمخزون (3-4 أسابيع)
المرحلة 6: التكاملات والنظام البيئي (4-6 أسابيع)
المرحلة 7: التطبيق والأوفلاين (6-8 أسابيع)
```

**المدة الإجمالية المقدرة: 29-40 أسبوع**

---

# المرحلة 1: الأساسيات والبنية التحتية

## 1.1 الوضع الداكن (Dark Mode)
**الأولوية**: منخفضة | **الجهد**: صغير | **المدة**: 3-5 أيام

### Backend
- لا تغييرات مطلوبة (إعداد frontend فقط)

### Frontend
```
frontend/src/
├── store/themeStore.ts              ← جديد: Zustand store للثيم
├── lib/theme/
│   ├── colors.ts                    ← جديد: ألوان الوضع الفاتح والداكن
│   └── ThemeProvider.tsx            ← جديد: Context provider
├── components/ui/ThemeToggle.tsx     ← جديد: زر تبديل الثيم
└── tailwind.config.ts               ← تعديل: إضافة darkMode: 'class'
```

### المهام
- [ ] إعداد `darkMode: 'class'` في Tailwind
- [ ] إنشاء ThemeProvider مع localStorage persistence
- [ ] إنشاء متغيرات CSS للألوان (--bg-primary, --text-primary, etc.)
- [ ] تحديث كل المكونات لدعم `dark:` classes
- [ ] إضافة زر التبديل في Header
- [ ] اختبار كل الشاشات بالوضعين

---

## 1.2 استيراد CSV جماعي
**الأولوية**: متوسطة | **الجهد**: متوسط | **المدة**: 5-7 أيام

### Backend
```
backend/MsCashier.Application/
├── Services/CsvImportService.cs     ← جديد
├── Interfaces/ICsvImportService.cs  ← جديد
├── DTOs/CsvImport.cs               ← جديد
│
backend/MsCashier.API/
├── Controllers/ImportExportController.cs  ← جديد
```

### Frontend
```
frontend/src/features/inventory/components/
├── CsvImportModal.tsx               ← جديد: واجهة الاستيراد
├── CsvMappingStep.tsx               ← جديد: ربط الأعمدة
├── CsvPreviewStep.tsx               ← جديد: معاينة البيانات
├── CsvResultStep.tsx                ← جديد: نتائج الاستيراد
```

### المهام
- [ ] تصميم قالب CSV (اسم، باركود، SKU، سعر، فئة، مخزون...)
- [ ] Backend: Parser CSV مع validation
- [ ] Backend: Batch insert مع error handling (skip/abort)
- [ ] Backend: Export CSV للمنتجات الحالية
- [ ] Frontend: Upload + Column mapping UI
- [ ] Frontend: Preview + Validation errors
- [ ] Frontend: Progress bar + Results summary
- [ ] دعم استيراد: منتجات، عملاء، فئات

---

## 1.3 متغيرات العناصر (Item Variants)
**الأولوية**: متوسطة-عالية | **الجهد**: كبير | **المدة**: 10-14 يوم

### Database Entities
```csharp
// جديد
public class ProductVariantOption  // مثل: "الحجم" أو "اللون"
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Name { get; set; }          // "الحجم"
    public string NameAr { get; set; }
    public int SortOrder { get; set; }
    public List<ProductVariantValue> Values { get; set; }
}

public class ProductVariantValue  // مثل: "صغير"، "وسط"، "كبير"
{
    public int Id { get; set; }
    public int VariantOptionId { get; set; }
    public string Value { get; set; }         // "صغير"
    public string ValueAr { get; set; }
    public int SortOrder { get; set; }
}

public class ProductVariant  // تركيبة محددة: "أحمر + كبير"
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Sku { get; set; }
    public string Barcode { get; set; }
    public decimal RetailPrice { get; set; }
    public decimal HalfWholesalePrice { get; set; }
    public decimal WholesalePrice { get; set; }
    public decimal CostPrice { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; }
    public string VariantCombination { get; set; }  // JSON: {"الحجم":"كبير","اللون":"أحمر"}
}
```

### Backend
```
backend/MsCashier.Application/
├── DTOs/ProductVariant.cs
├── Services/ProductVariantService.cs
├── Interfaces/IProductVariantService.cs
│
backend/MsCashier.API/Controllers/
├── ProductVariantsController.cs
```

### Frontend
```
frontend/src/features/inventory/components/
├── VariantOptionsEditor.tsx         ← إدارة الخيارات (حجم، لون)
├── VariantMatrixGenerator.tsx       ← توليد كل التركيبات
├── VariantPricingTable.tsx          ← جدول أسعار لكل تركيبة
├── VariantStockTable.tsx            ← مخزون كل تركيبة
├── VariantSelector.tsx              ← اختيار في POS
```

### المهام
- [ ] Migration: إنشاء جداول ProductVariantOption, ProductVariantValue, ProductVariant
- [ ] Backend: CRUD للخيارات والقيم
- [ ] Backend: Auto-generate variant combinations (Cartesian product)
- [ ] Backend: تعديل InvoiceService لدعم الـ variants
- [ ] Backend: تعديل InventoryService لتتبع مخزون كل variant
- [ ] Frontend: واجهة إنشاء الخيارات (حجم/لون/مادة...)
- [ ] Frontend: جدول التركيبات مع أسعار ومخزون لكل تركيبة
- [ ] Frontend: تعديل POS لاختيار الـ variant عند إضافة منتج
- [ ] Frontend: تعديل تقارير المخزون لإظهار الـ variants
- [ ] تعديل مسح الباركود ليعمل مع variant barcodes

---

## 1.4 شاشة عرض العميل (Customer Display)
**الأولوية**: منخفضة | **الجهد**: متوسط | **المدة**: 5-7 أيام

### Architecture
- تطبيق ويب منفصل يعمل على شاشة ثانية
- اتصال عبر WebSocket أو BroadcastChannel API
- لا يحتاج تسجيل دخول

### Backend
```
backend/MsCashier.API/
├── Hubs/CustomerDisplayHub.cs       ← جديد: SignalR Hub
```

### Frontend
```
frontend/src/features/customer-display/
├── CustomerDisplayApp.tsx           ← جديد: تطبيق الشاشة الثانية
├── components/
│   ├── OrderItems.tsx               ← عناصر الطلب الحالي
│   ├── PaymentSummary.tsx           ← ملخص الدفع
│   ├── LoyaltyPoints.tsx            ← نقاط الولاء
│   ├── WelcomeScreen.tsx            ← شاشة الترحيب (إعلانات)
│   └── BrandingHeader.tsx           ← شعار ومعلومات المتجر
```

### المهام
- [ ] Backend: إعداد SignalR Hub للبث الآني
- [ ] Frontend: صفحة `/customer-display` منفصلة (بدون auth)
- [ ] عرض: العناصر، الكميات، الأسعار، الخصومات، الضرائب، الإجمالي
- [ ] عرض: المبلغ المدفوع والباقي بعد الدفع
- [ ] عرض: نقاط الولاء (بعد تنفيذ برنامج الولاء)
- [ ] شاشة ترحيب مع شعار المتجر عند عدم وجود طلب
- [ ] دعم ملء الشاشة (F11)

---

# المرحلة 2: تجربة المستخدم والولاء

## 2.1 برنامج الولاء بالنقاط
**الأولوية**: عالية | **الجهد**: كبير | **المدة**: 10-14 يوم

### Database Entities
```csharp
public class LoyaltyProgram
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; }
    public string NameAr { get; set; }
    public decimal PointsPerCurrency { get; set; }     // نقاط لكل 1 ريال/جنيه
    public decimal RedemptionValue { get; set; }        // قيمة كل نقطة عند الاستبدال
    public int MinRedemptionPoints { get; set; }        // حد أدنى للاستبدال
    public int PointsExpireDays { get; set; }           // صلاحية النقاط (0 = لا تنتهي)
    public bool IsActive { get; set; }
    public bool ApplyToAllCategories { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class LoyaltyTier  // مستويات الولاء: برونزي، فضي، ذهبي
{
    public int Id { get; set; }
    public int LoyaltyProgramId { get; set; }
    public string Name { get; set; }
    public string NameAr { get; set; }
    public int MinPoints { get; set; }
    public decimal BonusMultiplier { get; set; }        // مضاعف النقاط (1.5x للذهبي)
    public decimal DiscountPercentage { get; set; }     // خصم إضافي
    public string Color { get; set; }                   // لون البادج
}

public class CustomerLoyalty
{
    public int Id { get; set; }
    public int ContactId { get; set; }
    public int LoyaltyProgramId { get; set; }
    public int CurrentPoints { get; set; }
    public int TotalEarnedPoints { get; set; }
    public int TotalRedeemedPoints { get; set; }
    public int? CurrentTierId { get; set; }
    public string LoyaltyCardBarcode { get; set; }
    public DateTime EnrolledAt { get; set; }
}

public class LoyaltyTransaction
{
    public int Id { get; set; }
    public int CustomerLoyaltyId { get; set; }
    public int? InvoiceId { get; set; }
    public LoyaltyTransactionType Type { get; set; }    // Earn, Redeem, Expire, Adjust
    public int Points { get; set; }
    public string Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
```

### Backend
```
backend/MsCashier.Application/
├── DTOs/Loyalty.cs
├── Services/LoyaltyService.cs
├── Interfaces/ILoyaltyService.cs
│
backend/MsCashier.API/Controllers/
├── LoyaltyController.cs
```

### Frontend
```
frontend/src/features/loyalty/
├── components/
│   ├── LoyaltySettingsScreen.tsx     ← إعدادات البرنامج
│   ├── LoyaltyTiersEditor.tsx        ← مستويات الولاء
│   ├── CustomerPointsCard.tsx        ← بطاقة نقاط العميل
│   ├── PointsHistory.tsx             ← سجل النقاط
│   ├── RedeemPointsModal.tsx         ← استبدال النقاط
│   └── LoyaltyDashboard.tsx          ← إحصائيات البرنامج
│
frontend/src/features/pos/components/
├── LoyaltyWidget.tsx                 ← ويدجت النقاط في POS
```

### المهام
- [ ] Migration: إنشاء جداول LoyaltyProgram, LoyaltyTier, CustomerLoyalty, LoyaltyTransaction
- [ ] Backend: إعداد برنامج الولاء (نقاط/ريال، قيمة الاستبدال، الصلاحية)
- [ ] Backend: كسب النقاط تلقائياً عند كل عملية بيع
- [ ] Backend: استبدال النقاط كخصم في الفاتورة
- [ ] Backend: انتهاء صلاحية النقاط (Background Job)
- [ ] Backend: مستويات الولاء (برونزي/فضي/ذهبي) مع مضاعفات
- [ ] Backend: توليد باركود بطاقة الولاء
- [ ] Frontend: شاشة إعدادات برنامج الولاء
- [ ] Frontend: عرض نقاط العميل في POS عند اختياره
- [ ] Frontend: زر استبدال النقاط أثناء البيع
- [ ] Frontend: سجل نقاط العميل
- [ ] Frontend: لوحة إحصائيات الولاء (عملاء مسجلين، نقاط صادرة، مستبدلة)
- [ ] عرض النقاط على الإيصال المطبوع
- [ ] مسح بطاقة الولاء بالباركود

---

## 2.2 ملاحظات العملاء وتحسينات CRM
**الأولوية**: منخفضة | **الجهد**: صغير | **المدة**: 2-3 أيام

### المهام
- [ ] إضافة حقل `Notes` و `Address` لجدول Contact
- [ ] Frontend: حقل ملاحظات في نموذج العميل
- [ ] Frontend: عرض العنوان على الإيصال (اختياري)
- [ ] Frontend: عرض ملاحظات العميل في POS عند اختياره

---

# المرحلة 3: المتجر الإلكتروني لكل مستأجر (الميزة الحصرية الكبرى)

## 3.1 بنية المتجر الإلكتروني
**الأولوية**: عالية جداً | **الجهد**: كبير جداً | **المدة**: 6-8 أسابيع

### المفهوم
كل مستأجر (Tenant) يحصل على متجر إلكتروني خاص بواجهة مخصصة، مربوط بالكامل مع:
- المخزون (تحديث تلقائي للكميات)
- نقطة البيع (استقبال الطلبات مباشرة)
- الطباعة المباشرة (طباعة الطلب للتجهيز)
- الدفع الإلكتروني

### Architecture
```
                    ┌─────────────────────────┐
                    │   MPOS Admin Dashboard   │
                    │   (React - الحالي)       │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │   MPOS Backend API       │
                    │   (.NET 8 - الحالي)      │
                    │                          │
                    │  + StoreBuilder Module   │
                    │  + StoreFront API        │
                    │  + WebHook Engine        │
                    │  + Print Queue Service   │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                   │
    ┌─────────┴──────┐  ┌──────┴───────┐  ┌──────┴────────┐
    │ متجر tenant-1  │  │ متجر tenant-2│  │ متجر tenant-3 │
    │ store1.mpos.app │  │ myshop.com   │  │ store3.mpos.app│
    │ (Next.js SSR)   │  │ (Next.js SSR)│  │ (Next.js SSR)  │
    └────────────────┘  └──────────────┘  └───────────────┘
```

### Database Entities
```csharp
// ===== إعدادات المتجر الإلكتروني =====

public class OnlineStore
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Subdomain { get; set; }              // store1.mpos.app
    public string? CustomDomain { get; set; }           // myshop.com
    public bool IsActive { get; set; }
    public bool IsPublished { get; set; }
    public string ThemeId { get; set; }                 // قالب التصميم
    public string ThemeSettings { get; set; }           // JSON: ألوان، خطوط، إلخ
    public string LogoUrl { get; set; }
    public string FaviconUrl { get; set; }
    public string MetaTitle { get; set; }
    public string MetaDescription { get; set; }
    public string GoogleAnalyticsId { get; set; }
    public string FacebookPixelId { get; set; }
    public string CustomCss { get; set; }
    public string CustomJs { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StoreTheme
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string NameAr { get; set; }
    public string Slug { get; set; }                    // "modern-retail", "restaurant-dark"
    public string Category { get; set; }                // "retail", "restaurant", "grocery"
    public string PreviewImageUrl { get; set; }
    public string TemplateConfig { get; set; }          // JSON: أقسام الصفحة القابلة للتخصيص
    public bool IsFree { get; set; }
    public bool IsActive { get; set; }
}

public class StorePage
{
    public int Id { get; set; }
    public int OnlineStoreId { get; set; }
    public string Title { get; set; }
    public string TitleAr { get; set; }
    public string Slug { get; set; }                    // "about", "contact", "faq"
    public string Content { get; set; }                 // HTML/Markdown
    public string ContentAr { get; set; }
    public bool IsPublished { get; set; }
    public int SortOrder { get; set; }
    public string PageType { get; set; }                // "static", "product-list", "home"
    public string SectionsConfig { get; set; }          // JSON: drag-drop sections
}

public class StoreBanner
{
    public int Id { get; set; }
    public int OnlineStoreId { get; set; }
    public string ImageUrl { get; set; }
    public string MobileImageUrl { get; set; }
    public string Title { get; set; }
    public string TitleAr { get; set; }
    public string Subtitle { get; set; }
    public string LinkUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
}

public class StoreNavigationItem
{
    public int Id { get; set; }
    public int OnlineStoreId { get; set; }
    public string Label { get; set; }
    public string LabelAr { get; set; }
    public string Url { get; set; }
    public int? ParentId { get; set; }
    public int SortOrder { get; set; }
    public string Position { get; set; }                // "header", "footer"
}

// ===== طلبات المتجر الإلكتروني =====

public class OnlineOrder
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int OnlineStoreId { get; set; }
    public string OrderNumber { get; set; }             // STORE-20260413-001
    public int? ContactId { get; set; }                 // عميل مسجل (اختياري)

    // بيانات العميل (ضيف أو مسجل)
    public string CustomerName { get; set; }
    public string CustomerPhone { get; set; }
    public string CustomerEmail { get; set; }
    public string ShippingAddress { get; set; }         // JSON: عنوان التوصيل
    public string BillingAddress { get; set; }

    // المبالغ
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }

    // الحالة
    public OnlineOrderStatus Status { get; set; }       // Pending, Confirmed, Preparing, Shipped, Delivered, Cancelled
    public OnlinePaymentStatus PaymentStatus { get; set; } // Pending, Paid, Failed, Refunded
    public string PaymentMethod { get; set; }           // "card", "cod", "wallet"
    public string PaymentReference { get; set; }        // معرف عملية الدفع

    // ربط مع POS
    public int? InvoiceId { get; set; }                 // الفاتورة المرتبطة في POS
    public bool IsPrintedForPreparation { get; set; }   // هل تم طباعته للتجهيز
    public DateTime? PrintedAt { get; set; }

    // الشحن
    public OnlineOrderType OrderType { get; set; }      // Delivery, Pickup, DineIn
    public string DeliveryNotes { get; set; }
    public DateTime? EstimatedDeliveryAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class OnlineOrderItem
{
    public int Id { get; set; }
    public int OnlineOrderId { get; set; }
    public int ProductId { get; set; }
    public int? ProductVariantId { get; set; }
    public string ProductName { get; set; }
    public string VariantDescription { get; set; }      // "أحمر - كبير"
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string Notes { get; set; }
}

// ===== إعدادات الدفع الإلكتروني =====

public class OnlinePaymentConfig
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int OnlineStoreId { get; set; }
    public string Provider { get; set; }                // "stripe", "paytabs", "fawry", "tap", "moyasar"
    public string ApiKey { get; set; }                  // مشفر
    public string SecretKey { get; set; }               // مشفر
    public string WebhookSecret { get; set; }           // مشفر
    public string Currency { get; set; }                // "SAR", "EGP"
    public bool IsActive { get; set; }
    public bool IsTestMode { get; set; }
    public string SupportedMethods { get; set; }        // JSON: ["card", "mada", "apple_pay", "stc_pay"]
}

public class StoreShippingConfig
{
    public int Id { get; set; }
    public int OnlineStoreId { get; set; }
    public string ShippingType { get; set; }            // "flat_rate", "free", "by_zone", "pickup"
    public decimal? FlatRate { get; set; }
    public decimal? FreeShippingMinimum { get; set; }
    public string ZoneRates { get; set; }               // JSON: أسعار حسب المنطقة
    public bool IsActive { get; set; }
}
```

### Backend — وحدات جديدة
```
backend/MsCashier.Application/
├── DTOs/
│   ├── OnlineStore.cs
│   ├── OnlineOrder.cs
│   ├── OnlinePayment.cs
│   ├── StoreTheme.cs
│   └── StorePage.cs
├── Services/
│   ├── OnlineStoreService.cs        ← إدارة المتجر (إعدادات، صفحات، بنرات)
│   ├── OnlineOrderService.cs        ← إدارة الطلبات (إنشاء، تحديث حالة، ربط POS)
│   ├── OnlinePaymentService.cs      ← معالجة الدفع (Stripe, PayTabs, Tap)
│   ├── StorefrontService.cs         ← API العام للمتجر (منتجات، فئات، بحث)
│   ├── OrderPrintService.cs         ← طباعة الطلبات المباشرة للتجهيز
│   └── StoreThemeService.cs         ← إدارة القوالب
├── Interfaces/
│   ├── IOnlineStoreService.cs
│   ├── IOnlineOrderService.cs
│   ├── IOnlinePaymentService.cs
│   ├── IStorefrontService.cs
│   └── IOrderPrintService.cs
│
backend/MsCashier.API/Controllers/
├── OnlineStoreController.cs         ← CRUD للمتجر (admin)
├── OnlineOrdersController.cs        ← إدارة الطلبات (admin)
├── StorefrontController.cs          ← API العام (بدون auth)
├── StoreCheckoutController.cs       ← عملية الشراء (بدون auth)
├── StorePaymentWebhookController.cs ← Webhooks للدفع
│
backend/MsCashier.API/Hubs/
├── OrderNotificationHub.cs          ← إشعارات آنية للطلبات الجديدة
├── PrintQueueHub.cs                 ← إرسال أوامر الطباعة لـ POS
```

### Storefront (متجر العميل) — Next.js
```
storefront/                          ← مشروع Next.js جديد
├── app/
│   ├── layout.tsx                   ← Layout رئيسي مع RTL
│   ├── page.tsx                     ← الصفحة الرئيسية
│   ├── products/
│   │   ├── page.tsx                 ← قائمة المنتجات
│   │   └── [slug]/page.tsx          ← صفحة المنتج
│   ├── categories/
│   │   └── [slug]/page.tsx          ← صفحة الفئة
│   ├── cart/page.tsx                ← سلة التسوق
│   ├── checkout/page.tsx            ← صفحة الدفع
│   ├── checkout/success/page.tsx    ← تأكيد الطلب
│   ├── order-tracking/page.tsx      ← تتبع الطلب
│   ├── [page]/page.tsx              ← صفحات ثابتة (عن المتجر، اتصل بنا)
│   └── api/
│       └── webhook/route.ts         ← Payment webhooks
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── MobileMenu.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── VariantSelector.tsx
│   │   ├── AddToCartButton.tsx
│   │   └── ProductReviews.tsx
│   ├── cart/
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── checkout/
│   │   ├── CheckoutForm.tsx
│   │   ├── AddressForm.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── OrderSummary.tsx
│   │   └── StripePaymentForm.tsx
│   ├── home/
│   │   ├── HeroBanner.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── CategoryShowcase.tsx
│   │   └── PromoBanner.tsx
│   └── ui/ (shadcn/ui)
├── lib/
│   ├── api.ts                       ← Storefront API client
│   ├── cart.ts                      ← Cart state (localStorage + Zustand)
│   └── theme.ts                     ← Dynamic theme from store settings
├── middleware.ts                     ← Tenant routing (subdomain → tenant)
└── next.config.ts
```

### Admin Dashboard — شاشات جديدة
```
frontend/src/features/online-store/
├── components/
│   ├── StoreBuilderScreen.tsx       ← الشاشة الرئيسية لإدارة المتجر
│   ├── StoreSettingsTab.tsx         ← إعدادات عامة (اسم، شعار، دومين)
│   ├── StoreThemeTab.tsx            ← اختيار وتخصيص القالب
│   ├── StoreThemeCustomizer.tsx     ← تخصيص الألوان والخطوط
│   ├── StorePagesTab.tsx            ← إدارة الصفحات
│   ├── PageEditor.tsx               ← محرر الصفحات (drag-drop sections)
│   ├── StoreBannersTab.tsx          ← إدارة البنرات
│   ├── StoreNavigationTab.tsx       ← قائمة التنقل
│   ├── StoreProductsTab.tsx         ← المنتجات المعروضة أونلاين
│   ├── StorePaymentTab.tsx          ← إعدادات الدفع الإلكتروني
│   ├── StoreShippingTab.tsx         ← إعدادات الشحن
│   ├── OnlineOrdersScreen.tsx       ← قائمة طلبات المتجر الإلكتروني
│   ├── OnlineOrderDetail.tsx        ← تفاصيل الطلب + تحديث الحالة
│   └── StoreDashboardTab.tsx        ← إحصائيات المتجر الإلكتروني
```

### سير عمل الطلب (Order Flow)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ العميل يطلب   │────▶│ الدفع عبر    │────▶│ تأكيد الطلب   │
│ من المتجر     │     │ بوابة الدفع   │     │ + إشعار      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                    ┌─────────────────────────────┘
                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ إشعار آني    │────▶│ طباعة تلقائية │────▶│ تحديث حالة   │
│ على POS      │     │ للتجهيز      │     │ الطلب         │
│ (SignalR)    │     │ (ESC/POS)    │     │ (جاهز/شُحن)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

### قوالب المتجر (Themes)
```
themes/
├── modern-retail/       ← للتجزئة العامة
├── restaurant-menu/     ← للمطاعم (مع طلب أونلاين)
├── grocery-fresh/       ← للبقالة والسوبرماركت
├── fashion-boutique/    ← للأزياء والبوتيك
├── electronics-store/   ← للإلكترونيات
└── minimal-clean/       ← قالب بسيط متعدد الاستخدامات
```

### إعدادات الدفع الإلكتروني المدعومة
| البوابة | الدول | الطرق |
|---------|-------|-------|
| Stripe | عالمي | بطاقات، Apple Pay، Google Pay |
| PayTabs | السعودية، مصر، الإمارات | بطاقات، مدى، STC Pay |
| Tap | السعودية، الكويت، البحرين | بطاقات، مدى، Apple Pay |
| Moyasar | السعودية | بطاقات، مدى، Apple Pay، STC Pay |
| Fawry | مصر | فوري، بطاقات |
| الدفع عند الاستلام (COD) | الكل | نقداً |

### المهام
- [ ] Migration: إنشاء جداول OnlineStore, StorePage, StoreBanner, StoreNavigationItem, OnlineOrder, OnlineOrderItem, OnlinePaymentConfig, StoreShippingConfig
- [ ] Backend: OnlineStoreService (CRUD, إعدادات، نشر)
- [ ] Backend: StorefrontService (API عام — منتجات، فئات، بحث)
- [ ] Backend: StoreCheckout (إنشاء طلب، حساب الشحن)
- [ ] Backend: OnlinePaymentService (Stripe, PayTabs, Tap, Moyasar, Fawry)
- [ ] Backend: Webhook handlers لكل بوابة دفع
- [ ] Backend: OrderNotificationHub (SignalR — إشعار آني عند طلب جديد)
- [ ] Backend: PrintQueueHub (إرسال أمر طباعة لـ POS)
- [ ] Backend: ربط OnlineOrder مع Invoice في POS
- [ ] Backend: تحديث المخزون تلقائياً عند كل طلب
- [ ] Backend: StoreThemeService (قوالب + تخصيص)
- [ ] Storefront: مشروع Next.js مع App Router
- [ ] Storefront: Middleware لتوجيه الـ subdomain للـ tenant الصحيح
- [ ] Storefront: الصفحة الرئيسية (بنرات، منتجات مميزة، فئات)
- [ ] Storefront: صفحة المنتجات مع فلترة وبحث
- [ ] Storefront: صفحة المنتج الواحد (صور، وصف، variants، إضافة للسلة)
- [ ] Storefront: سلة التسوق (Drawer + صفحة)
- [ ] Storefront: صفحة الدفع (بيانات + عنوان + طريقة الدفع)
- [ ] Storefront: تأكيد الطلب + تتبع الحالة
- [ ] Storefront: 6 قوالب (retail, restaurant, grocery, fashion, electronics, minimal)
- [ ] Storefront: RTL + عربي كامل
- [ ] Storefront: SEO (meta tags, OG, structured data)
- [ ] Storefront: responsive (mobile-first)
- [ ] Admin: شاشة StoreBuilder (إعدادات، قالب، صفحات، بنرات)
- [ ] Admin: شاشة إعدادات الدفع الإلكتروني (بوابات + طرق)
- [ ] Admin: شاشة إدارة الطلبات الإلكترونية
- [ ] Admin: إشعار آني + صوت عند طلب جديد على POS
- [ ] Admin: طباعة تلقائية للطلب (ESC/POS) للتجهيز
- [ ] Admin: لوحة إحصائيات المتجر الإلكتروني
- [ ] Hosting: إعداد subdomain routing (*.mpos.app)
- [ ] Hosting: دعم Custom domain (DNS + SSL)

---

# المرحلة 4: التواصل الاجتماعي والتسويق

## 4.1 ربط منصات التواصل الاجتماعي
**الأولوية**: عالية | **الجهد**: كبير | **المدة**: 3-4 أسابيع

### المفهوم
كل متجر يربط حساباته على منصات التواصل، والنظام ينشر تلقائياً:
- عروض جديدة
- منتجات جديدة
- تغييرات الأسعار (اختياري)
- محتوى مخصص

### Database Entities
```csharp
public class SocialMediaAccount
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Platform { get; set; }                // "facebook", "instagram", "twitter", "tiktok", "snapchat"
    public string AccountName { get; set; }
    public string AccountId { get; set; }               // Platform-specific ID
    public string AccessToken { get; set; }             // مشفر — OAuth token
    public string RefreshToken { get; set; }            // مشفر
    public DateTime? TokenExpiresAt { get; set; }
    public string PageId { get; set; }                  // Facebook Page ID
    public bool IsActive { get; set; }
    public DateTime ConnectedAt { get; set; }
}

public class SocialMediaPost
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Content { get; set; }                 // نص المنشور
    public string ContentAr { get; set; }
    public string ImageUrls { get; set; }               // JSON: قائمة الصور
    public string VideoUrl { get; set; }
    public string Hashtags { get; set; }
    public SocialPostType Type { get; set; }            // Product, Offer, Custom, AutoGenerated
    public int? ProductId { get; set; }                 // المنتج المرتبط
    public int? OfferId { get; set; }                   // العرض المرتبط
    public SocialPostStatus Status { get; set; }        // Draft, Scheduled, Published, Failed
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string PublishResults { get; set; }          // JSON: نتائج النشر لكل منصة
}

public class SocialMediaPostTarget
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public int SocialMediaAccountId { get; set; }
    public string PlatformPostId { get; set; }          // ID المنشور على المنصة
    public SocialPostStatus Status { get; set; }
    public string ErrorMessage { get; set; }
}

public class AutoPostRule
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string TriggerEvent { get; set; }            // "new_product", "new_offer", "price_change"
    public string TargetPlatforms { get; set; }         // JSON: ["facebook", "instagram"]
    public string ContentTemplate { get; set; }         // قالب المنشور مع متغيرات
    public string ContentTemplateAr { get; set; }
    public bool IncludeImage { get; set; }
    public bool IncludePrice { get; set; }
    public bool IncludeStoreLink { get; set; }
    public bool IsActive { get; set; }
}
```

### Backend
```
backend/MsCashier.Application/
├── DTOs/SocialMedia.cs
├── Services/
│   ├── SocialMediaService.cs        ← ربط الحسابات + إدارة المنشورات
│   ├── SocialMediaPublisher.cs      ← محرك النشر (Facebook API, Twitter API, etc.)
│   ├── AutoPostService.cs           ← القواعد التلقائية + مراقبة الأحداث
│   └── ContentTemplateEngine.cs     ← توليد محتوى المنشور من القالب
│
backend/MsCashier.API/Controllers/
├── SocialMediaController.cs         ← إدارة الحسابات والمنشورات
├── SocialMediaCallbackController.cs ← OAuth callbacks
```

### Frontend
```
frontend/src/features/social-media/
├── components/
│   ├── SocialMediaScreen.tsx        ← الشاشة الرئيسية
│   ├── ConnectAccountTab.tsx        ← ربط الحسابات (OAuth flow)
│   ├── PostComposer.tsx             ← كتابة منشور جديد
│   ├── PostScheduler.tsx            ← جدولة المنشورات
│   ├── PostHistory.tsx              ← سجل المنشورات
│   ├── AutoPostRulesTab.tsx         ← قواعد النشر التلقائي
│   ├── ContentTemplateEditor.tsx    ← محرر قوالب المنشورات
│   └── SocialDashboard.tsx          ← إحصائيات (منشورات، تفاعل)
```

### المنصات المدعومة
| المنصة | API | القدرات |
|--------|-----|---------|
| Facebook Pages | Graph API v19 | نص + صور + فيديو + رابط |
| Instagram Business | Graph API v19 | صور + فيديو + Reels + Stories |
| Twitter/X | API v2 | نص + صور + فيديو |
| TikTok Business | Marketing API | فيديو |
| Snapchat Business | Marketing API | صور + فيديو |
| WhatsApp Business | Cloud API | نص + صور + كتالوج |

### قوالب المنشورات التلقائية
```
منتج جديد:
"🆕 وصل حديثاً: {product_name}
{product_description}
💰 السعر: {price} {currency}
🛒 اطلب الآن: {store_link}
{hashtags}"

عرض خاص:
"🔥 عرض خاص!
{offer_title}
خصم {discount}% على {product_name}
⏰ ينتهي: {end_date}
🛒 استفد الآن: {store_link}"
```

### المهام
- [ ] Migration: إنشاء جداول SocialMediaAccount, SocialMediaPost, SocialMediaPostTarget, AutoPostRule
- [ ] Backend: OAuth integration لكل منصة (Facebook, Instagram, Twitter)
- [ ] Backend: Publishing engine (نشر فعلي عبر APIs)
- [ ] Backend: Auto-post rules (مراقبة أحداث + نشر تلقائي)
- [ ] Backend: Content template engine (تعبئة المتغيرات)
- [ ] Backend: Image upload/resize للمنصات المختلفة
- [ ] Backend: Background job لجدولة المنشورات
- [ ] Backend: Token refresh تلقائي
- [ ] Frontend: شاشة ربط الحسابات (OAuth flow)
- [ ] Frontend: محرر المنشورات (نص + صور + معاينة)
- [ ] Frontend: جدولة المنشورات (تقويم)
- [ ] Frontend: قواعد النشر التلقائي
- [ ] Frontend: محرر قوالب المحتوى
- [ ] Frontend: سجل المنشورات + الحالة
- [ ] تنبيه عند فشل نشر

---

# المرحلة 5: RFID + QR Code للمخزون

## 5.1 نظام RFID و QR Code المتكامل
**الأولوية**: عالية | **الجهد**: كبير | **المدة**: 3-4 أسابيع

### المفهوم
- **RFID**: لجرد سريع للمخزون — تمرير القارئ على الرفوف ويجرد مئات الأصناف في ثوانٍ
- **QR Code**: لتعريف المنتجات والمستودعات والأرفف — مسح QR لمعرفة تفاصيل الصنف أو الموقع

### Database Entities
```csharp
public class ProductRfidTag
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int? ProductVariantId { get; set; }
    public string RfidTagId { get; set; }               // EPC (Electronic Product Code)
    public string TagType { get; set; }                  // "UHF", "HF", "NFC"
    public int? WarehouseId { get; set; }
    public string ShelfLocation { get; set; }            // "A1-R3-S5" (ممر-رف-رفة)
    public bool IsActive { get; set; }
    public DateTime TaggedAt { get; set; }
    public DateTime? LastScannedAt { get; set; }
}

public class WarehouseQrCode
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string QrCodeData { get; set; }              // encoded data
    public string QrCodeImageUrl { get; set; }
    public string QrType { get; set; }                  // "warehouse", "zone", "shelf", "bin"
    public string LocationCode { get; set; }            // "WH01-Z02-S03-B04"
    public string Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RfidScanSession
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int WarehouseId { get; set; }
    public int UserId { get; set; }
    public string SessionType { get; set; }             // "full_count", "partial_count", "spot_check"
    public RfidScanStatus Status { get; set; }          // InProgress, Completed, Cancelled
    public int TotalTagsScanned { get; set; }
    public int MatchedItems { get; set; }
    public int UnmatchedTags { get; set; }              // موجود RFID لكن غير مسجل
    public int MissingItems { get; set; }               // مسجل لكن RFID غير موجود
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class RfidScanResult
{
    public int Id { get; set; }
    public int ScanSessionId { get; set; }
    public string RfidTagId { get; set; }
    public int? ProductId { get; set; }
    public string ScannedLocation { get; set; }         // الموقع الفعلي عند المسح
    public string ExpectedLocation { get; set; }        // الموقع المتوقع
    public RfidScanResultType ResultType { get; set; }  // Matched, Misplaced, Unknown, Missing
    public DateTime ScannedAt { get; set; }
}

public class InventoryCountQr
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int WarehouseId { get; set; }
    public int UserId { get; set; }
    public string CountType { get; set; }               // "qr_scan", "qr_batch"
    public int TotalScanned { get; set; }
    public int Matched { get; set; }
    public int Discrepancies { get; set; }
    public QrCountStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
```

### Backend
```
backend/MsCashier.Application/
├── DTOs/
│   ├── RfidInventory.cs
│   └── QrInventory.cs
├── Services/
│   ├── RfidService.cs               ← إدارة RFID tags + مسح + جرد
│   ├── QrInventoryService.cs        ← QR codes للمستودعات + جرد
│   ├── InventoryCountService.cs     ← محرك الجرد الموحد (RFID + QR + يدوي)
│   └── RfidDeviceService.cs         ← تكامل أجهزة RFID
│
backend/MsCashier.API/Controllers/
├── RfidController.cs                ← إدارة RFID tags + sessions
├── QrInventoryController.cs         ← QR codes + جرد
├── InventoryCountController.cs      ← جرد موحد
│
backend/MsCashier.API/Hubs/
├── RfidScanHub.cs                   ← بث آني لنتائج المسح
```

### Frontend
```
frontend/src/features/rfid-inventory/
├── components/
│   ├── RfidManagementScreen.tsx     ← الشاشة الرئيسية
│   ├── RfidTaggingTab.tsx           ← ربط RFID tags بالمنتجات
│   ├── RfidScanSession.tsx          ← جلسة مسح RFID
│   ├── RfidScanLiveView.tsx         ← عرض آني للمسح (SignalR)
│   ├── RfidScanResults.tsx          ← نتائج المسح (مطابق، مفقود، غير معروف)
│   ├── RfidDiscrepancyReport.tsx    ← تقرير الفروقات
│   ├── QrWarehouseSetup.tsx         ← إعداد QR للمستودعات والأرفف
│   ├── QrCodeGenerator.tsx          ← توليد QR codes
│   ├── QrScanCount.tsx              ← جرد عبر مسح QR
│   ├── InventoryCountDashboard.tsx  ← لوحة الجرد الموحدة
│   └── ShelfLocationManager.tsx     ← إدارة مواقع الأرفف
```

### الأجهزة المدعومة
| الجهاز | النوع | الاتصال | الاستخدام |
|--------|-------|---------|----------|
| Zebra FX9600 | RFID Reader (Fixed) | Ethernet | جرد المستودعات الكبيرة |
| Zebra MC3300x | RFID Handheld | Wi-Fi/BT | جرد متنقل |
| Chainway C72 | RFID + Barcode | Wi-Fi/BT/USB | متعدد الاستخدامات |
| Impinj Speedway | RFID Reader (Fixed) | Ethernet | بوابات المستودعات |
| أي كاميرا/ماسح | QR Scanner | USB/Camera | مسح QR |

### سير عمل الجرد بـ RFID
```
1. إنشاء جلسة جرد (اختيار المستودع والنوع)
         │
2. بدء المسح (اتصال بجهاز RFID)
         │
3. بث آني للنتائج (SignalR)
   ├── ✅ مطابق (الصنف في موقعه الصحيح)
   ├── ⚠️ في غير مكانه (الصنف موجود لكن بموقع خاطئ)
   ├── ❌ مفقود (مسجل لكن غير موجود)
   └── ❓ غير معروف (RFID tag غير مسجل)
         │
4. إيقاف المسح + مراجعة النتائج
         │
5. تطبيق التسويات (تحديث المخزون تلقائياً أو يدوياً)
```

### سير عمل الجرد بـ QR
```
1. توليد QR codes للمستودعات والأرفف
         │
2. طباعة ولصق QR على كل رف/منطقة
         │
3. بدء جلسة جرد:
   ├── مسح QR الرف → عرض المنتجات المتوقعة
   ├── مسح QR/باركود كل منتج → تأكيد الوجود
   └── إدخال الكمية الفعلية
         │
4. مقارنة تلقائية (متوقع vs فعلي)
         │
5. تقرير فروقات + تسوية
```

### المهام
- [ ] Migration: إنشاء جداول ProductRfidTag, WarehouseQrCode, RfidScanSession, RfidScanResult, InventoryCountQr
- [ ] Backend: RfidService (ربط tags بالمنتجات، بدء/إيقاف المسح)
- [ ] Backend: RfidDeviceService (TCP/HTTP للتواصل مع أجهزة RFID)
- [ ] Backend: RfidScanHub (بث آني لنتائج المسح)
- [ ] Backend: QrInventoryService (توليد QR، ربط بالمواقع)
- [ ] Backend: InventoryCountService (محرك جرد موحد)
- [ ] Backend: تقارير الفروقات والتسويات التلقائية
- [ ] Frontend: شاشة إدارة RFID tags (ربط tag بمنتج)
- [ ] Frontend: جلسة مسح RFID مع عرض آني
- [ ] Frontend: تقرير نتائج المسح (مطابق/مفقود/غير معروف)
- [ ] Frontend: توليد وطباعة QR codes للمستودعات والأرفف
- [ ] Frontend: جرد عبر مسح QR (مسح الرف ثم المنتجات)
- [ ] Frontend: لوحة جرد موحدة (RFID + QR + يدوي)
- [ ] Frontend: إدارة مواقع الأرفف (Shelf Location Manager)
- [ ] تكامل مع أجهزة RFID (Zebra, Chainway, Impinj)

---

# المرحلة 6: التكاملات والنظام البيئي

## 6.1 API عام للمطورين
**الأولوية**: متوسطة | **الجهد**: كبير | **المدة**: 2-3 أسابيع

### المهام
- [ ] تصميم Public API (RESTful, versioned: /api/v1/)
- [ ] نظام API Keys (توليد + صلاحيات + rate limiting)
- [ ] OAuth 2.0 للتطبيقات الخارجية
- [ ] Webhook system (أحداث: طلب جديد، بيع، تحديث مخزون)
- [ ] API Documentation (Swagger/OpenAPI + موقع توثيق)
- [ ] Rate limiting (100 req/min default)
- [ ] Endpoints: Products, Orders, Inventory, Customers, Invoices

## 6.2 Webhooks Engine
**الأولوية**: متوسطة | **الجهد**: متوسط | **المدة**: 1-2 أسبوع

### Database
```csharp
public class WebhookSubscription
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Url { get; set; }
    public string Events { get; set; }                  // JSON: ["order.created", "inventory.updated"]
    public string Secret { get; set; }                  // للتحقق من التوقيع
    public bool IsActive { get; set; }
    public int FailureCount { get; set; }
}

public class WebhookDelivery
{
    public int Id { get; set; }
    public int SubscriptionId { get; set; }
    public string Event { get; set; }
    public string Payload { get; set; }                 // JSON
    public int StatusCode { get; set; }
    public string Response { get; set; }
    public bool Success { get; set; }
    public DateTime DeliveredAt { get; set; }
}
```

### المهام
- [ ] Migration: WebhookSubscription, WebhookDelivery
- [ ] Backend: WebhookEngine (fire events, retry logic, signature verification)
- [ ] Backend: الأحداث المدعومة:
  - `order.created`, `order.updated`, `order.cancelled`
  - `invoice.created`, `invoice.refunded`
  - `product.created`, `product.updated`, `product.deleted`
  - `inventory.low_stock`, `inventory.updated`
  - `customer.created`, `customer.updated`
  - `online_order.created`, `online_order.paid`
- [ ] Frontend: شاشة إدارة Webhooks (إنشاء، اختبار، سجل)

## 6.3 تكامل Zapier / Make (اختياري — يعتمد على API العام)
- يعتمد على وجود API العام + Webhooks
- Zapier: إنشاء Zapier App في Zapier Platform
- Make: إنشاء وحدة Make مع API endpoints

---

# المرحلة 7: التطبيق والأوفلاين

## 7.1 تطبيق PWA (Progressive Web App)
**الأولوية**: عالية جداً | **الجهد**: كبير | **المدة**: 3-4 أسابيع

### المهام
- [ ] إضافة Service Worker مع Workbox
- [ ] App Manifest (أيقونة، اسم، ألوان)
- [ ] تحسين الواجهة للهاتف (responsive mobile-first)
- [ ] Install prompt (إضافة للشاشة الرئيسية)
- [ ] Push Notifications (عبر Firebase Cloud Messaging)
- [ ] تحسين الأداء (lazy loading, code splitting)
- [ ] اختبار على iOS Safari + Android Chrome

## 7.2 الوضع بدون اتصال (Offline Mode)
**الأولوية**: عالية جداً | **الجهد**: كبير جداً | **المدة**: 3-4 أسابيع

### Architecture
```
┌─────────────────────────────────┐
│         Service Worker           │
│  (Workbox - Cache Strategies)    │
└───────────┬─────────────────────┘
            │
┌───────────┴─────────────────────┐
│      IndexedDB (Dexie.js)        │
│  ┌──────────┐  ┌──────────────┐ │
│  │ Products  │  │ Pending Txns │ │
│  │ (cached)  │  │ (queue)      │ │
│  └──────────┘  └──────────────┘ │
│  ┌──────────┐  ┌──────────────┐ │
│  │ Customers │  │ Settings     │ │
│  │ (cached)  │  │ (cached)     │ │
│  └──────────┘  └──────────────┘ │
└───────────┬─────────────────────┘
            │
┌───────────┴─────────────────────┐
│       Sync Engine                │
│  - Background Sync API           │
│  - Conflict Resolution           │
│  - Retry with exponential backoff│
│  - Delta sync (changes only)     │
└─────────────────────────────────┘
```

### المهام
- [ ] إعداد Dexie.js (IndexedDB wrapper) مع schema
- [ ] Cache: منتجات، فئات، عملاء، إعدادات المتجر
- [ ] Queue: فواتير البيع + المدفوعات (pending sync)
- [ ] Sync Engine: مزامنة عند العودة للاتصال
- [ ] Conflict Resolution: Last-write-wins أو merge strategy
- [ ] Delta Sync: مزامنة التغييرات فقط (ليس كل البيانات)
- [ ] UI: مؤشر حالة الاتصال (أونلاين/أوفلاين/مزامنة)
- [ ] UI: عداد المعاملات المعلقة
- [ ] تشفير البيانات المحلية (sensitive data)
- [ ] اختبار: بيع أوفلاين → مزامنة → تحقق

---

# ملخص المراحل والجداول الزمنية

| المرحلة | الميزات الرئيسية | المدة | الأولوية |
|---------|-----------------|-------|---------|
| **1** | Dark Mode + CSV Import + Item Variants + Customer Display | 4-6 أسابيع | عالية |
| **2** | برنامج الولاء + تحسينات CRM | 3-4 أسابيع | عالية |
| **3** | المتجر الإلكتروني + الدفع الأونلاين + الطباعة المباشرة | 6-8 أسابيع | عالية جداً |
| **4** | التواصل الاجتماعي + النشر التلقائي | 3-4 أسابيع | متوسطة-عالية |
| **5** | RFID + QR Code للمخزون | 3-4 أسابيع | عالية |
| **6** | API عام + Webhooks + تكاملات | 4-6 أسابيع | متوسطة |
| **7** | PWA + Offline Mode | 6-8 أسابيع | عالية جداً |

---

# Database Migrations Summary

### المرحلة 1
- `ProductVariantOption`, `ProductVariantValue`, `ProductVariant`

### المرحلة 2
- `LoyaltyProgram`, `LoyaltyTier`, `CustomerLoyalty`, `LoyaltyTransaction`

### المرحلة 3
- `OnlineStore`, `StoreTheme`, `StorePage`, `StoreBanner`, `StoreNavigationItem`
- `OnlineOrder`, `OnlineOrderItem`
- `OnlinePaymentConfig`, `StoreShippingConfig`

### المرحلة 4
- `SocialMediaAccount`, `SocialMediaPost`, `SocialMediaPostTarget`, `AutoPostRule`

### المرحلة 5
- `ProductRfidTag`, `WarehouseQrCode`
- `RfidScanSession`, `RfidScanResult`, `InventoryCountQr`

### المرحلة 6
- `ApiKey`, `ApiKeyPermission`
- `WebhookSubscription`, `WebhookDelivery`

**إجمالي الكيانات الجديدة: ~30 كيان**
**إجمالي الكيانات بعد التنفيذ: ~88 كيان**
