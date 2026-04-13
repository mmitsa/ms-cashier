namespace MsCashier.Application.DTOs;

// ─── Store Branding & Invoice Design ─────────────
/// <summary>
/// Stored as JSON in Tenant.Settings column — no migration needed.
/// Each tenant has their own branding and invoice design.
/// </summary>
public class StoreSettingsDto
{
    // ─── Branding ───────────────────────────────
    public string? LogoUrl { get; set; }
    public string? StoreName { get; set; }
    public string? Tagline { get; set; }
    public string? Phone1 { get; set; }
    public string? Phone2 { get; set; }
    public string? WhatsApp { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Region { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }

    // ─── Social Media ───────────────────────────
    public string? Facebook { get; set; }
    public string? Instagram { get; set; }
    public string? Twitter { get; set; }
    public string? TikTok { get; set; }

    // ─── Invoice Design ─────────────────────────
    public InvoiceDesignDto Invoice { get; set; } = new();
}

public class InvoiceDesignDto
{
    /// <summary>عرض الفاتورة بالمليمتر (80mm thermal default)</summary>
    public int PaperWidthMm { get; set; } = 80;

    /// <summary>إظهار اللوجو في الفاتورة</summary>
    public bool ShowLogo { get; set; } = true;

    /// <summary>إظهار الباركود</summary>
    public bool ShowBarcode { get; set; } = true;

    /// <summary>نوع الباركود: QR, Code128, EAN13</summary>
    public string BarcodeType { get; set; } = "QR";

    /// <summary>إظهار الرقم الضريبي</summary>
    public bool ShowTaxNumber { get; set; } = true;

    /// <summary>نص الهيدر (أعلى الفاتورة)</summary>
    public string? HeaderText { get; set; }

    /// <summary>نص الفوتر (أسفل الفاتورة — مثلاً "شكراً لزيارتكم")</summary>
    public string? FooterText { get; set; } = "شكراً لزيارتكم — نتمنى لكم تجربة سعيدة";

    /// <summary>إظهار اسم الكاشير</summary>
    public bool ShowCashierName { get; set; } = true;

    /// <summary>إظهار اسم المندوب</summary>
    public bool ShowSalesRepName { get; set; } = true;

    /// <summary>لون أساسي (hex)</summary>
    public string PrimaryColor { get; set; } = "#6366f1";

    /// <summary>خط الفاتورة</summary>
    public string FontFamily { get; set; } = "Arial";

    /// <summary>حجم الخط الأساسي</summary>
    public int FontSize { get; set; } = 10;
}

// ─── Currency DTOs ───────────────────────────────
public record TenantCurrencyDto(
    int Id,
    string CurrencyCode,
    string CurrencyName,
    string? Symbol,
    decimal ExchangeRate,
    bool IsDefault,
    bool IsActive);

public record SaveTenantCurrencyRequest(
    string CurrencyCode,
    string CurrencyName,
    string? Symbol,
    decimal ExchangeRate,
    bool IsDefault = false);

// ─── Tax Config DTOs ─────────────────────────────
public record TenantTaxConfigDto(
    int Id,
    string Provider,
    bool IsEnabled,
    string? EtaClientId,
    string? EtaApiUrl,
    string? EtaBranchCode,
    string? EtaActivityCode,
    string? TaxRegistrationNumber,
    decimal DefaultVatRate,
    decimal? TableTaxRate,
    bool TaxInclusive,
    DateTime? LastSyncAt,
    string? LastSyncStatus,
    int TotalSubmitted,
    int TotalAccepted,
    int TotalRejected);

public record SaveTaxConfigRequest(
    string Provider,
    bool IsEnabled,
    string? EtaClientId,
    string? EtaClientSecret,
    string? EtaApiUrl,
    string? EtaBranchCode,
    string? EtaActivityCode,
    string? TaxRegistrationNumber,
    decimal DefaultVatRate,
    decimal? TableTaxRate,
    bool TaxInclusive);
