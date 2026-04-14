namespace MsCashier.Domain.Enums;

public static class ModuleKey
{
    public const string Sales = "Sales";
    public const string Inventory = "Inventory";
    public const string Restaurant = "Restaurant";
    public const string Employees = "Employees";
    public const string Payroll = "Payroll";
    public const string Attendance = "Attendance";
    public const string Loyalty = "Loyalty";
    public const string OnlineStore = "OnlineStore";
    public const string Finance = "Finance";
    public const string SalesReps = "SalesReps";
    public const string Rfid = "Rfid";
    public const string SocialMedia = "SocialMedia";
    public const string Api = "Api";
    public const string Branches = "Branches";
    public const string Reports = "Reports";
    public const string Installments = "Installments";
    public const string Production = "Production";
    public const string Terminals = "Terminals";
    public const string Accounting = "Accounting";

    public static readonly IReadOnlyList<(string Key, string NameAr, string Category, bool DefaultEnabled)> All = new[]
    {
        (Sales, "المبيعات ونقاط البيع", "Core", true),
        (Inventory, "المخزون والمستودعات", "Core", true),
        (Reports, "التقارير", "Core", true),
        (Finance, "الحسابات والخزينة", "Core", true),
        (Accounting, "المحاسبة العامة ودفتر الأستاذ", "Core", true),
        (Employees, "إدارة الموظفين", "HR", false),
        (Attendance, "الحضور والانصراف", "HR", false),
        (Payroll, "الرواتب", "HR", false),
        (Restaurant, "خدمة المطعم", "Restaurant", false),
        (Production, "الإنتاج والمطبخ", "Restaurant", false),
        (Loyalty, "الولاء والنقاط", "CRM", false),
        (OnlineStore, "المتجر الإلكتروني", "Online", false),
        (SocialMedia, "التواصل الاجتماعي", "Online", false),
        (SalesReps, "المندوبين والعمولات", "Sales", false),
        (Branches, "الفروع المتعددة", "Advanced", false),
        (Rfid, "RFID وجرد سريع", "Advanced", false),
        (Installments, "الأقساط", "Advanced", false),
        (Terminals, "أجهزة الدفع POS", "Advanced", false),
        (Api, "واجهات API العامة", "Advanced", false),
    };
}
