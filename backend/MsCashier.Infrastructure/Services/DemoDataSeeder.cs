using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Infrastructure.Data;

namespace MsCashier.Infrastructure.Services;

public class DemoDataSeeder : IDemoDataSeeder
{
    private readonly AppDbContext _db;
    private readonly ILogger<DemoDataSeeder> _logger;

    public DemoDataSeeder(AppDbContext db, ILogger<DemoDataSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Result<string>> SeedDemoDataAsync(Guid tenantId)
    {
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null)
            return Result<string>.Failure("المستأجر غير موجود");

        // Guard: don't seed twice
        var hasProducts = await _db.Products.IgnoreQueryFilters().AnyAsync(p => p.TenantId == tenantId);
        if (hasProducts)
            return Result<string>.Failure("يوجد بيانات مسبقة لهذا المستأجر. احذف البيانات أولاً أو استخدم مستأجر جديد.");

        _logger.LogInformation("Seeding demo data for tenant {TenantId}...", tenantId);

        // ============================================================
        // 1. Warehouse
        // ============================================================

        var warehouse = await _db.Warehouses.IgnoreQueryFilters().FirstOrDefaultAsync(w => w.TenantId == tenantId && w.IsMain);
        if (warehouse == null)
        {
            warehouse = new Warehouse
            {
                TenantId = tenantId,
                Name = "المخزن الرئيسي",
                Location = "الرياض",
                IsMain = true,
                IsActive = true
            };
            _db.Warehouses.Add(warehouse);
            await _db.SaveChangesAsync();
        }

        // ============================================================
        // 2. Unit
        // ============================================================

        var unit = new Unit
        {
            TenantId = tenantId,
            Name = "حبة",
            Symbol = "حبة",
            IsBase = true
        };
        _db.Units.Add(unit);
        await _db.SaveChangesAsync();

        // ============================================================
        // 3. Categories (8)
        // ============================================================

        var categoryNames = new[]
        {
            "أطباق رئيسية", "مقبلات", "مشروبات ساخنة", "مشروبات باردة",
            "حلويات", "سلطات", "وجبات أطفال", "إضافات"
        };

        var categories = new Dictionary<string, Category>();
        for (int i = 0; i < categoryNames.Length; i++)
        {
            var cat = new Category
            {
                TenantId = tenantId,
                Name = categoryNames[i],
                SortOrder = i + 1,
                IsActive = true
            };
            _db.Categories.Add(cat);
            categories[categoryNames[i]] = cat;
        }
        await _db.SaveChangesAsync();

        // ============================================================
        // 4. Products (22)
        // ============================================================

        var productDefs = new (string Name, string Category, decimal Retail, string Barcode, int Stock)[]
        {
            ("شاورما لحم",    "أطباق رئيسية",   25m, "6001000000001", 150),
            ("شاورما دجاج",   "أطباق رئيسية",   20m, "6001000000002", 180),
            ("برجر كلاسيك",   "أطباق رئيسية",   30m, "6001000000003", 120),
            ("برجر مزدوج",    "أطباق رئيسية",   45m, "6001000000004", 100),

            ("فتوش",          "سلطات",          15m, "6001000000005", 80),
            ("تبولة",         "سلطات",          12m, "6001000000006", 80),

            ("حمص",           "مقبلات",         10m, "6001000000007", 100),

            ("قهوة عربية",    "مشروبات ساخنة",  8m,  "6001000000008", 200),
            ("كابتشينو",      "مشروبات ساخنة", 15m, "6001000000009", 200),
            ("شاي",           "مشروبات ساخنة",  5m,  "6001000000010", 200),
            ("لاتيه",         "مشروبات ساخنة", 18m, "6001000000011", 150),

            ("عصير برتقال",   "مشروبات باردة",  10m, "6001000000012", 120),
            ("عصير مانجو",    "مشروبات باردة",  12m, "6001000000013", 120),
            ("مياه",          "مشروبات باردة",   3m, "6001000000014", 200),
            ("بيبسي",         "مشروبات باردة",   5m, "6001000000015", 200),

            ("كنافة",         "حلويات",         20m, "6001000000016", 60),
            ("بقلاوة",        "حلويات",         18m, "6001000000017", 60),
            ("آيس كريم",      "حلويات",          8m, "6001000000018", 100),

            ("وجبة أطفال",    "وجبات أطفال",    25m, "6001000000019", 80),

            ("بطاطس مقلية",   "إضافات",          8m, "6001000000020", 150),
            ("صوص إضافي",     "إضافات",          2m, "6001000000021", 200),
            ("خبز إضافي",     "إضافات",          3m, "6001000000022", 200),
        };

        var products = new List<Product>();
        foreach (var (name, catName, retail, barcode, stock) in productDefs)
        {
            var cost = Math.Round(retail * 0.40m, 2);
            var product = new Product
            {
                TenantId = tenantId,
                Name = name,
                Barcode = barcode,
                SKU = $"SKU-{barcode[^4..]}",
                CategoryId = categories[catName].Id,
                UnitId = unit.Id,
                CostPrice = cost,
                RetailPrice = retail,
                TaxRate = 15m,
                MinStock = 10m,
                MaxStock = stock * 2m,
                IsActive = true,
                TrackInventory = true
            };
            _db.Products.Add(product);
            products.Add(product);
        }
        await _db.SaveChangesAsync();

        // Create inventory records
        for (int i = 0; i < products.Count; i++)
        {
            _db.Inventories.Add(new Inventory
            {
                TenantId = tenantId,
                ProductId = products[i].Id,
                WarehouseId = warehouse.Id,
                Quantity = productDefs[i].Stock,
                ReservedQty = 0,
                LastUpdated = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();

        // ============================================================
        // 5. Customers (5)
        // ============================================================

        var customerDefs = new (string Name, string Phone, string? Email)[]
        {
            ("خالد العتيبي",   "0551234567", "khalid@example.com"),
            ("سارة الدوسري",   "0559876543", "sara@example.com"),
            ("محمد الشهري",    "0501112233", "mohammed@example.com"),
            ("نورة القحطاني",  "0544455667", "noura@example.com"),
            ("أحمد المطيري",   "0533344556", "ahmed@example.com"),
        };

        var customers = new List<Contact>();
        foreach (var (name, phone, email) in customerDefs)
        {
            var customer = new Contact
            {
                TenantId = tenantId,
                ContactType = ContactType.Customer,
                Name = name,
                Phone = phone,
                Email = email,
                PriceType = PriceType.Retail,
                Balance = 0,
                IsActive = true
            };
            _db.Contacts.Add(customer);
            customers.Add(customer);
        }
        await _db.SaveChangesAsync();

        // ============================================================
        // 6. Suppliers (2)
        // ============================================================

        var supplierDefs = new (string Name, string Phone, string Address)[]
        {
            ("شركة المواد الغذائية", "0112345678", "الرياض - حي الصناعية"),
            ("مصنع المشروبات",       "0119876543", "جدة - حي الخمرة"),
        };

        foreach (var (name, phone, address) in supplierDefs)
        {
            _db.Contacts.Add(new Contact
            {
                TenantId = tenantId,
                ContactType = ContactType.Supplier,
                Name = name,
                Phone = phone,
                Address = address,
                PriceType = PriceType.Retail,
                Balance = 0,
                IsActive = true
            });
        }
        await _db.SaveChangesAsync();

        // ============================================================
        // 7. Employees (3)
        // ============================================================

        var employeeDefs = new (string Name, string Position, string Phone, decimal Salary)[]
        {
            ("محمد سالم",  "كاشير",         "0551111111", 4500m),
            ("عمر حسن",    "نادل",          "0552222222", 3500m),
            ("فاطمة علي",  "مديرة مناوبة",  "0553333333", 6000m),
        };

        foreach (var (name, position, phone, salary) in employeeDefs)
        {
            _db.Employees.Add(new Employee
            {
                TenantId = tenantId,
                Name = name,
                Position = position,
                Phone = phone,
                Department = "العمليات",
                BasicSalary = salary,
                HousingAllowance = Math.Round(salary * 0.25m, 2),
                TransportAllowance = 500m,
                OtherAllowance = 0m,
                HireDate = DateTime.UtcNow.AddMonths(-6),
                IsActive = true
            });
        }
        await _db.SaveChangesAsync();

        // ============================================================
        // 8. Floor Sections + Tables
        // ============================================================

        var indoorSection = new FloorSection
        {
            TenantId = tenantId,
            Name = "الصالة الداخلية",
            Description = "صالة الطعام الرئيسية مكيّفة",
            Color = "#6366f1",
            Icon = "sofa",
            SortOrder = 1,
            IsActive = true,
            IsOutdoor = false,
            HasAC = true,
            IsSmokingAllowed = false,
            MaxCapacity = 30
        };
        _db.FloorSections.Add(indoorSection);

        var terrace = new FloorSection
        {
            TenantId = tenantId,
            Name = "التراس",
            Description = "جلسات خارجية مع إطلالة",
            Color = "#10b981",
            Icon = "trees",
            SortOrder = 2,
            IsActive = true,
            IsOutdoor = true,
            HasAC = false,
            IsSmokingAllowed = true,
            MaxCapacity = 20
        };
        _db.FloorSections.Add(terrace);
        await _db.SaveChangesAsync();

        // Indoor tables (6)
        for (int i = 1; i <= 6; i++)
        {
            _db.RestaurantTables.Add(new RestaurantTable
            {
                TenantId = tenantId,
                TableNumber = $"T{i:D2}",
                SectionId = indoorSection.Id,
                Capacity = i <= 4 ? 4 : 6,
                Status = TableStatus.Available,
                IsActive = true,
                GridRow = (i - 1) / 3,
                GridCol = (i - 1) % 3,
                Shape = i <= 4 ? "square" : "rectangle"
            });
        }

        // Terrace tables (4)
        for (int i = 1; i <= 4; i++)
        {
            _db.RestaurantTables.Add(new RestaurantTable
            {
                TenantId = tenantId,
                TableNumber = $"P{i:D2}",
                SectionId = terrace.Id,
                Capacity = i <= 2 ? 2 : 4,
                Status = TableStatus.Available,
                IsActive = true,
                GridRow = 0,
                GridCol = i - 1,
                Shape = "circle"
            });
        }
        await _db.SaveChangesAsync();

        // ============================================================
        // 9. Loyalty Program
        // ============================================================

        _db.LoyaltyPrograms.Add(new LoyaltyProgram
        {
            TenantId = tenantId,
            Name = "برنامج الولاء",
            PointsPerCurrency = 1m,
            RedemptionValue = 0.1m,
            MinRedemptionPoints = 100,
            PointsExpireDays = 365,
            IsActive = true
        });
        await _db.SaveChangesAsync();

        // ============================================================
        // 10. Sample Invoices (5)
        // ============================================================

        // Find a user for CreatedBy
        var user = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.TenantId == tenantId);
        var createdBy = user?.Id ?? Guid.Empty;

        var now = DateTime.UtcNow;
        var invoiceData = new (int[] ProductIndices, int? CustomerIndex, PaymentMethod Payment, int DaysAgo)[]
        {
            (new[] { 0, 7, 14 },  0, PaymentMethod.Cash,         0),   // شاورما لحم + قهوة + مياه — خالد
            (new[] { 2, 4, 11 },  1, PaymentMethod.Visa,         1),   // برجر + فتوش + عصير برتقال — سارة
            (new[] { 1, 8, 15 },  null, PaymentMethod.Cash,      2),   // شاورما دجاج + كابتشينو + كنافة — بدون عميل
            (new[] { 3, 6, 9, 13 }, 2, PaymentMethod.Visa,       3),   // برجر مزدوج + حمص + شاي + بيبسي — محمد
            (new[] { 18, 19, 14 }, 3, PaymentMethod.Cash,        5),   // وجبة أطفال + بطاطس + مياه — نورة
        };

        int invoiceNum = 1;
        foreach (var (productIndices, customerIdx, payment, daysAgo) in invoiceData)
        {
            decimal subTotal = 0;
            var items = new List<InvoiceItem>();

            foreach (var idx in productIndices)
            {
                var p = products[idx];
                var qty = 1m;
                var lineTotal = p.RetailPrice * qty;
                var lineTax = Math.Round(lineTotal * 0.15m, 2);

                items.Add(new InvoiceItem
                {
                    ProductId = p.Id,
                    Quantity = qty,
                    UnitPrice = p.RetailPrice,
                    CostPrice = p.CostPrice,
                    DiscountAmount = 0,
                    TaxAmount = lineTax,
                    TotalPrice = lineTotal + lineTax
                });

                subTotal += lineTotal;
            }

            var totalTax = Math.Round(subTotal * 0.15m, 2);
            var totalAmount = subTotal + totalTax;

            var invoice = new Invoice
            {
                TenantId = tenantId,
                InvoiceNumber = $"INV-{invoiceNum:D5}",
                InvoiceType = InvoiceType.Sale,
                InvoiceDate = now.AddDays(-daysAgo),
                ContactId = customerIdx.HasValue ? customers[customerIdx.Value].Id : null,
                WarehouseId = warehouse.Id,
                PriceType = PriceType.Retail,
                SubTotal = subTotal,
                DiscountAmount = 0,
                TaxAmount = totalTax,
                TotalAmount = totalAmount,
                PaidAmount = totalAmount,
                DueAmount = 0,
                PaymentMethod = payment,
                PaymentStatus = PaymentStatus.Paid,
                CreatedBy = createdBy,
                Items = items
            };

            _db.Invoices.Add(invoice);
            invoiceNum++;
        }
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Demo data seeded successfully for tenant {TenantId}: {Categories} categories, {Products} products, {Customers} customers, {Invoices} invoices",
            tenantId, categoryNames.Length, products.Count, customerDefs.Length, invoiceData.Length);

        return Result<string>.Success(
            $"تم تحميل البيانات التجريبية بنجاح: {categoryNames.Length} تصنيفات، {products.Count} منتج، {customerDefs.Length} عملاء، {invoiceData.Length} فواتير");
    }
}
