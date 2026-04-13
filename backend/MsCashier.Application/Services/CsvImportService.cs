using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

public class CsvImportService : ICsvImportService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public CsvImportService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    // ═══════════════════════════════════════════════════════════
    // Import Products
    // ═══════════════════════════════════════════════════════════

    public async Task<Result<CsvImportResult>> ImportProductsAsync(Stream csvStream, int warehouseId, bool skipDuplicates)
    {
        var errors = new List<CsvImportError>();
        var warnings = new List<string>();
        int success = 0, skipped = 0, total = 0;

        try
        {
            using var reader = new StreamReader(csvStream, Encoding.UTF8);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
                HeaderValidated = null,
                TrimOptions = TrimOptions.Trim,
            });

            var rows = csv.GetRecords<ProductCsvRow>().ToList();
            total = rows.Count;

            if (total == 0)
                return Result<CsvImportResult>.Failure("الملف فارغ أو لا يحتوي على بيانات صالحة");

            // Pre-load categories and units for matching
            var categories = await _uow.Repository<Category>().Query()
                .Where(c => !c.IsDeleted).ToDictionaryAsync(c => c.Name.ToLower(), c => c.Id);
            var units = await _uow.Repository<Unit>().Query()
                .Where(u => !u.IsDeleted).ToDictionaryAsync(u => u.Name.ToLower(), u => u.Id);
            var existingBarcodes = await _uow.Repository<Product>().Query()
                .Where(p => !p.IsDeleted && p.Barcode != null)
                .Select(p => p.Barcode!.ToLower()).ToListAsync().ContinueWith(t => t.Result.ToHashSet());

            await _uow.BeginTransactionAsync();

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int rowNum = i + 2; // +2 for header + 0-index

                // Validate required fields
                if (string.IsNullOrWhiteSpace(row.Name))
                {
                    errors.Add(new CsvImportError(rowNum, "Name", "", "اسم المنتج مطلوب"));
                    continue;
                }

                if (row.RetailPrice <= 0)
                {
                    errors.Add(new CsvImportError(rowNum, "RetailPrice", row.RetailPrice.ToString(), "سعر التجزئة يجب أن يكون أكبر من صفر"));
                    continue;
                }

                // Check duplicate barcode
                if (!string.IsNullOrWhiteSpace(row.Barcode) && existingBarcodes.Contains(row.Barcode.ToLower()))
                {
                    if (skipDuplicates) { skipped++; continue; }
                    errors.Add(new CsvImportError(rowNum, "Barcode", row.Barcode, "الباركود موجود مسبقاً"));
                    continue;
                }

                // Resolve category
                int? categoryId = null;
                if (!string.IsNullOrWhiteSpace(row.CategoryName))
                {
                    if (categories.TryGetValue(row.CategoryName.ToLower(), out var catId))
                    {
                        categoryId = catId;
                    }
                    else
                    {
                        // Auto-create category
                        var newCat = new Category
                        {
                            TenantId = _tenant.TenantId,
                            Name = row.CategoryName.Trim(),
                            SortOrder = 0,
                        };
                        await _uow.Repository<Category>().AddAsync(newCat);
                        await _uow.SaveChangesAsync();
                        categories[row.CategoryName.ToLower()] = newCat.Id;
                        categoryId = newCat.Id;
                        warnings.Add($"تم إنشاء فئة جديدة: {row.CategoryName}");
                    }
                }

                // Resolve unit
                int? unitId = null;
                if (!string.IsNullOrWhiteSpace(row.UnitName))
                {
                    if (units.TryGetValue(row.UnitName.ToLower(), out var uId))
                        unitId = uId;
                    else
                        warnings.Add($"السطر {rowNum}: وحدة القياس '{row.UnitName}' غير موجودة — تم تجاهلها");
                }

                var product = new Product
                {
                    TenantId = _tenant.TenantId,
                    Barcode = row.Barcode?.Trim(),
                    SKU = row.SKU?.Trim(),
                    Name = row.Name.Trim(),
                                        CategoryId = categoryId,
                    UnitId = unitId,
                    CostPrice = row.CostPrice,
                    RetailPrice = row.RetailPrice,
                    HalfWholesalePrice = row.HalfWholesalePrice,
                    WholesalePrice = row.WholesalePrice,
                    TaxRate = row.TaxRate,
                    MinStock = row.MinStock,
                    MaxStock = row.MaxStock,
                    IsActive = true,
                    TrackInventory = true,
                };

                await _uow.Repository<Product>().AddAsync(product);
                await _uow.SaveChangesAsync();

                // Initialize inventory
                if (warehouseId > 0)
                {
                    var inventory = new Inventory
                    {
                        TenantId = _tenant.TenantId,
                        ProductId = product.Id,
                        WarehouseId = warehouseId,
                        Quantity = row.InitialStock,
                    };
                    await _uow.Repository<Inventory>().AddAsync(inventory);

                    if (row.InitialStock > 0)
                    {
                        await _uow.Repository<InventoryTransaction>().AddAsync(new InventoryTransaction
                        {
                            TenantId = _tenant.TenantId,
                            ProductId = product.Id,
                            WarehouseId = warehouseId,
                            Quantity = row.InitialStock,
                            TransactionType = InventoryTransactionType.StockIn,
                            Notes = "استيراد CSV",
                        });
                    }
                }

                if (!string.IsNullOrWhiteSpace(row.Barcode))
                    existingBarcodes.Add(row.Barcode.ToLower());

                success++;
            }

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            return Result<CsvImportResult>.Success(new CsvImportResult(total, success, skipped, errors.Count, errors, warnings));
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<CsvImportResult>.Failure($"خطأ أثناء الاستيراد: {ex.Message}");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Import Contacts
    // ═══════════════════════════════════════════════════════════

    public async Task<Result<CsvImportResult>> ImportContactsAsync(Stream csvStream, bool skipDuplicates)
    {
        var errors = new List<CsvImportError>();
        var warnings = new List<string>();
        int success = 0, skipped = 0, total = 0;

        try
        {
            using var reader = new StreamReader(csvStream, Encoding.UTF8);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true, MissingFieldFound = null, HeaderValidated = null, TrimOptions = TrimOptions.Trim,
            });

            var rows = csv.GetRecords<ContactCsvRow>().ToList();
            total = rows.Count;

            if (total == 0)
                return Result<CsvImportResult>.Failure("الملف فارغ");

            var existingPhones = await _uow.Repository<Contact>().Query()
                .Where(c => !c.IsDeleted && c.Phone != null)
                .Select(c => c.Phone!.ToLower()).ToListAsync().ContinueWith(t => t.Result.ToHashSet());

            await _uow.BeginTransactionAsync();

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int rowNum = i + 2;

                if (string.IsNullOrWhiteSpace(row.Name))
                {
                    errors.Add(new CsvImportError(rowNum, "Name", "", "اسم جهة الاتصال مطلوب"));
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(row.Phone) && existingPhones.Contains(row.Phone.ToLower()))
                {
                    if (skipDuplicates) { skipped++; continue; }
                    errors.Add(new CsvImportError(rowNum, "Phone", row.Phone, "رقم الهاتف موجود مسبقاً"));
                    continue;
                }

                var contactType = row.Type?.ToLower() switch
                {
                    "supplier" or "مورد" => ContactType.Supplier,
                    "both" or "كلاهما" => ContactType.Both,
                    _ => ContactType.Customer,
                };

                var contact = new Contact
                {
                    TenantId = _tenant.TenantId,
                    Name = row.Name.Trim(),
                    Phone = row.Phone?.Trim(),
                    Phone2 = row.Phone2?.Trim(),
                    Email = row.Email?.Trim(),
                    Address = row.Address?.Trim(),
                    TaxNumber = row.TaxNumber?.Trim(),
                    ContactType = contactType,
                    CreditLimit = row.CreditLimit,
                    Notes = row.Notes?.Trim(),
                    IsActive = true,
                };

                await _uow.Repository<Contact>().AddAsync(contact);

                if (!string.IsNullOrWhiteSpace(row.Phone))
                    existingPhones.Add(row.Phone.ToLower());

                success++;
            }

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            return Result<CsvImportResult>.Success(new CsvImportResult(total, success, skipped, errors.Count, errors, warnings));
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<CsvImportResult>.Failure($"خطأ أثناء الاستيراد: {ex.Message}");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Import Categories
    // ═══════════════════════════════════════════════════════════

    public async Task<Result<CsvImportResult>> ImportCategoriesAsync(Stream csvStream, bool skipDuplicates)
    {
        var errors = new List<CsvImportError>();
        var warnings = new List<string>();
        int success = 0, skipped = 0, total = 0;

        try
        {
            using var reader = new StreamReader(csvStream, Encoding.UTF8);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true, MissingFieldFound = null, HeaderValidated = null, TrimOptions = TrimOptions.Trim,
            });

            var rows = csv.GetRecords<CategoryCsvRow>().ToList();
            total = rows.Count;

            if (total == 0)
                return Result<CsvImportResult>.Failure("الملف فارغ");

            var existing = await _uow.Repository<Category>().Query()
                .Where(c => !c.IsDeleted)
                .ToDictionaryAsync(c => c.Name.ToLower(), c => c.Id);

            await _uow.BeginTransactionAsync();

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int rowNum = i + 2;

                if (string.IsNullOrWhiteSpace(row.Name))
                {
                    errors.Add(new CsvImportError(rowNum, "Name", "", "اسم الفئة مطلوب"));
                    continue;
                }

                if (existing.ContainsKey(row.Name.ToLower()))
                {
                    if (skipDuplicates) { skipped++; continue; }
                    errors.Add(new CsvImportError(rowNum, "Name", row.Name, "الفئة موجودة مسبقاً"));
                    continue;
                }

                int? parentId = null;
                if (!string.IsNullOrWhiteSpace(row.ParentCategoryName) && existing.TryGetValue(row.ParentCategoryName.ToLower(), out var pid))
                    parentId = pid;

                var cat = new Category
                {
                    TenantId = _tenant.TenantId,
                    Name = row.Name.Trim(),
                                        ParentId = parentId,
                    SortOrder = row.SortOrder,
                };

                await _uow.Repository<Category>().AddAsync(cat);
                await _uow.SaveChangesAsync();
                existing[row.Name.ToLower()] = cat.Id;
                success++;
            }

            await _uow.CommitTransactionAsync();

            return Result<CsvImportResult>.Success(new CsvImportResult(total, success, skipped, errors.Count, errors, warnings));
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<CsvImportResult>.Failure($"خطأ أثناء الاستيراد: {ex.Message}");
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Export CSV
    // ═══════════════════════════════════════════════════════════

    public async Task<Result<byte[]>> ExportProductsCsvAsync(int? categoryId, bool activeOnly)
    {
        var query = _uow.Repository<Product>().Query().Where(p => !p.IsDeleted);
        if (activeOnly) query = query.Where(p => p.IsActive);
        if (categoryId.HasValue) query = query.Where(p => p.CategoryId == categoryId);

        var products = await query
            .Include(p => p.Category)
            .Include(p => p.Unit)
            .Include(p => p.InventoryItems)
            .OrderBy(p => p.Name)
            .ToListAsync();

        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms, new UTF8Encoding(true));
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        var rows = products.Select(p => new ProductCsvRow
        {
            Barcode = p.Barcode,
            SKU = p.SKU,
            Name = p.Name,
            Description = p.Description ?? null,
            CategoryName = p.Category?.Name,
            UnitName = p.Unit?.Name,
            CostPrice = p.CostPrice,
            RetailPrice = p.RetailPrice,
            HalfWholesalePrice = p.HalfWholesalePrice,
            WholesalePrice = p.WholesalePrice,
            TaxRate = p.TaxRate,
            MinStock = p.MinStock,
            MaxStock = p.MaxStock,
            InitialStock = p.InventoryItems.Sum(inv => inv.Quantity),
        });

        csv.WriteRecords(rows);
        await writer.FlushAsync();

        return Result<byte[]>.Success(ms.ToArray());
    }

    public async Task<Result<byte[]>> ExportContactsCsvAsync(bool activeOnly)
    {
        var query = _uow.Repository<Contact>().Query().Where(c => !c.IsDeleted);
        if (activeOnly) query = query.Where(c => c.IsActive);

        var contacts = await query.OrderBy(c => c.Name).ToListAsync();

        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms, new UTF8Encoding(true));
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        var rows = contacts.Select(c => new ContactCsvRow
        {
            Name = c.Name,
            Phone = c.Phone,
            Phone2 = c.Phone2,
            Email = c.Email,
            Address = c.Address,
            TaxNumber = c.TaxNumber,
            Type = c.ContactType.ToString(),
            CreditLimit = c.CreditLimit,
            Notes = c.Notes,
        });

        csv.WriteRecords(rows);
        await writer.FlushAsync();

        return Result<byte[]>.Success(ms.ToArray());
    }

    public async Task<Result<byte[]>> ExportCategoriesCsvAsync()
    {
        var categories = await _uow.Repository<Category>().Query()
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .ToListAsync();

        var catDict = categories.ToDictionary(c => c.Id, c => c.Name);

        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms, new UTF8Encoding(true));
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        var rows = categories.Select(c => new CategoryCsvRow
        {
            Name = c.Name,
                        ParentCategoryName = c.ParentId.HasValue && catDict.ContainsKey(c.ParentId.Value) ? catDict[c.ParentId.Value] : null,
            SortOrder = c.SortOrder,
        });

        csv.WriteRecords(rows);
        await writer.FlushAsync();

        return Result<byte[]>.Success(ms.ToArray());
    }

    // ═══════════════════════════════════════════════════════════
    // CSV Template
    // ═══════════════════════════════════════════════════════════

    public byte[] GetCsvTemplate(CsvImportType importType)
    {
        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms, new UTF8Encoding(true));
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        switch (importType)
        {
            case CsvImportType.Products:
                csv.WriteRecords(new[] { new ProductCsvRow
                {
                    Barcode = "6281000000001", SKU = "SKU001", Name = "منتج تجريبي",
                    Description = "وصف المنتج", CategoryName = "عام", UnitName = "قطعة",
                    CostPrice = 10, RetailPrice = 15, HalfWholesalePrice = 13, WholesalePrice = 12,
                    TaxRate = 15, MinStock = 5, MaxStock = 100, InitialStock = 50,
                }});
                break;
            case CsvImportType.Contacts:
                csv.WriteRecords(new[] { new ContactCsvRow
                {
                    Name = "عميل تجريبي", Phone = "0501234567", Email = "test@example.com",
                    Address = "الرياض", Type = "Customer", CreditLimit = 5000, Notes = "ملاحظة",
                }});
                break;
            case CsvImportType.Categories:
                csv.WriteRecords(new[] { new CategoryCsvRow
                {
                    Name = "فئة تجريبية", Description = "وصف الفئة", SortOrder = 1,
                }});
                break;
        }

        writer.Flush();
        return ms.ToArray();
    }
}
