using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface ICsvImportService
{
    Task<Result<CsvImportResult>> ImportProductsAsync(Stream csvStream, int warehouseId, bool skipDuplicates);
    Task<Result<CsvImportResult>> ImportContactsAsync(Stream csvStream, bool skipDuplicates);
    Task<Result<CsvImportResult>> ImportCategoriesAsync(Stream csvStream, bool skipDuplicates);
    Task<Result<byte[]>> ExportProductsCsvAsync(int? categoryId, bool activeOnly);
    Task<Result<byte[]>> ExportContactsCsvAsync(bool activeOnly);
    Task<Result<byte[]>> ExportCategoriesCsvAsync();
    byte[] GetCsvTemplate(CsvImportType importType);
}
