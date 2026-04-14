using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums.Accounting;

namespace MsCashier.Application.Accounting;

/// <summary>
/// شجرة الحسابات الافتراضية التي تُنشأ تلقائياً لكل تينانت جديد.
/// النواة الأساسية فقط (~35 حساب) — يمكن للتاجر إضافة المزيد لاحقاً.
/// تُستخدم من TenantProvisioningService أو Migration Seed.
/// </summary>
public static class DefaultChartOfAccounts
{
    public record AccountSeed(
        string Code,
        string NameAr,
        string NameEn,
        AccountCategory Category,
        bool IsGroup,
        string? ParentCode = null);

    /// <summary>
    /// قائمة الحسابات الافتراضية مرتبة بحيث يأتي الأب قبل الابن.
    /// Nature يُحسب تلقائياً من Category في BuildEntities.
    /// </summary>
    public static readonly IReadOnlyList<AccountSeed> Accounts = new List<AccountSeed>
    {
        // ============ 1. الأصول ============
        new("1",     "الأصول",                       "Assets",                 AccountCategory.Asset, true),
        new("11",    "الأصول المتداولة",              "Current Assets",         AccountCategory.Asset, true,  "1"),
        new("1101",  "الصندوق الرئيسي",               "Main Cash",              AccountCategory.Asset, false, "11"),
        new("1102",  "صناديق نقاط البيع",             "POS Cash Drawers",       AccountCategory.Asset, false, "11"),
        new("1110",  "البنوك",                       "Banks",                  AccountCategory.Asset, true,  "11"),
        new("1115",  "المحافظ الإلكترونية",            "Digital Wallets",        AccountCategory.Asset, true,  "11"),
        new("1120",  "مدفوعات الشبكة تحت التحصيل",     "Card Payments Clearing", AccountCategory.Asset, false, "11"),
        new("1130",  "العملاء — ذمم مدينة",           "Accounts Receivable",    AccountCategory.Asset, false, "11"),
        new("1140",  "المخزون",                      "Inventory",              AccountCategory.Asset, false, "11"),
        new("1150",  "سلف وعهد الموظفين",             "Employee Advances",      AccountCategory.Asset, false, "11"),
        new("1160",  "مصروفات مدفوعة مقدماً",          "Prepaid Expenses",       AccountCategory.Asset, false, "11"),
        new("1170",  "ضريبة القيمة المضافة — مدخلات",  "VAT Input",              AccountCategory.Asset, false, "11"),

        new("12",    "الأصول الثابتة",                "Fixed Assets",           AccountCategory.Asset, true,  "1"),
        new("1201",  "أثاث ومفروشات",                "Furniture & Fixtures",   AccountCategory.Asset, false, "12"),
        new("1202",  "أجهزة وحاسبات",                "Equipment & Computers",  AccountCategory.Asset, false, "12"),
        new("1290",  "مجمع الإهلاك",                  "Accumulated Depreciation", AccountCategory.Asset, false, "12"),

        // ============ 2. الخصوم ============
        new("2",     "الخصوم",                       "Liabilities",            AccountCategory.Liability, true),
        new("21",    "الخصوم المتداولة",              "Current Liabilities",    AccountCategory.Liability, true,  "2"),
        new("2101",  "الموردين — ذمم دائنة",          "Accounts Payable",       AccountCategory.Liability, false, "21"),
        new("2110",  "مستحقات الموظفين",              "Salaries Payable",       AccountCategory.Liability, false, "21"),
        new("2120",  "ضريبة القيمة المضافة — مخرجات", "VAT Output",             AccountCategory.Liability, false, "21"),
        new("2121",  "ضريبة القيمة المضافة — مستحقة", "VAT Payable",            AccountCategory.Liability, false, "21"),
        new("2140",  "إيرادات مقبوضة مقدماً",         "Deferred Revenue",       AccountCategory.Liability, false, "21"),
        new("2141",  "التزام نقاط الولاء",            "Loyalty Points Liability", AccountCategory.Liability, false, "21"),
        new("2142",  "بطاقات الهدايا غير المستخدمة",  "Gift Cards Outstanding", AccountCategory.Liability, false, "21"),

        // ============ 3. حقوق الملكية ============
        new("3",     "حقوق الملكية",                  "Equity",                 AccountCategory.Equity, true),
        new("3101",  "رأس المال",                    "Capital",                AccountCategory.Equity, false, "3"),
        new("3102",  "جاري الشركاء/المالك",           "Owner Drawings",         AccountCategory.Equity, false, "3"),
        new("3103",  "الأرباح المحتجزة",              "Retained Earnings",      AccountCategory.Equity, false, "3"),
        new("3104",  "أرباح/خسائر العام",             "Current Year Earnings",  AccountCategory.Equity, false, "3"),

        // ============ 4. الإيرادات ============
        new("4",     "الإيرادات",                    "Revenue",                AccountCategory.Revenue, true),
        new("4101",  "مبيعات نقدية",                  "Cash Sales",             AccountCategory.Revenue, false, "4"),
        new("4102",  "مبيعات آجلة",                   "Credit Sales",           AccountCategory.Revenue, false, "4"),
        new("4103",  "مبيعات أونلاين",                "Online Sales",           AccountCategory.Revenue, false, "4"),
        new("4110",  "مردودات المبيعات",              "Sales Returns",          AccountCategory.Revenue, false, "4"),
        new("4111",  "خصومات المبيعات",               "Sales Discounts",        AccountCategory.Revenue, false, "4"),
        new("4120",  "إيرادات التوصيل",               "Delivery Revenue",       AccountCategory.Revenue, false, "4"),
        new("4130",  "إيرادات أخرى",                  "Other Revenue",          AccountCategory.Revenue, false, "4"),

        // ============ 5. المصروفات ============
        new("5",     "المصروفات",                    "Expenses",               AccountCategory.Expense, true),
        new("51",    "تكلفة البضاعة المباعة",         "COGS",                   AccountCategory.Expense, true,  "5"),
        new("5101",  "تكلفة المبيعات",                "Cost of Sales",          AccountCategory.Expense, false, "51"),
        new("5104",  "شحن وجمارك المشتريات",          "Freight & Customs",      AccountCategory.Expense, false, "51"),
        new("5105",  "فروقات الجرد",                 "Inventory Adjustments",  AccountCategory.Expense, false, "51"),
        new("5106",  "تالف مخزون",                   "Inventory Damage",       AccountCategory.Expense, false, "51"),

        new("52",    "مصروفات البيع والتسويق",         "Selling Expenses",       AccountCategory.Expense, true,  "5"),
        new("5201",  "رواتب موظفي البيع",             "Sales Salaries",         AccountCategory.Expense, false, "52"),
        new("5202",  "عمولات المبيعات",               "Sales Commissions",      AccountCategory.Expense, false, "52"),
        new("5203",  "إعلانات وتسويق",                "Marketing & Advertising", AccountCategory.Expense, false, "52"),
        new("5205",  "عمولات شبكات الدفع",            "Payment Processing Fees", AccountCategory.Expense, false, "52"),

        new("53",    "المصروفات الإدارية والعمومية",   "G&A Expenses",           AccountCategory.Expense, true,  "5"),
        new("5301",  "إيجار",                        "Rent",                   AccountCategory.Expense, false, "53"),
        new("5302",  "كهرباء وماء",                  "Utilities",              AccountCategory.Expense, false, "53"),
        new("5304",  "إنترنت واتصالات",              "Internet & Communications", AccountCategory.Expense, false, "53"),
        new("5305",  "صيانة ونظافة",                 "Maintenance",            AccountCategory.Expense, false, "53"),
        new("5306",  "قرطاسية ومطبوعات",             "Office Supplies",        AccountCategory.Expense, false, "53"),
        new("5307",  "رسوم حكومية",                  "Government Fees",        AccountCategory.Expense, false, "53"),
        new("5308",  "اشتراكات برامج",                "Software Subscriptions", AccountCategory.Expense, false, "53"),
        new("5312",  "إهلاك الأصول الثابتة",          "Depreciation Expense",   AccountCategory.Expense, false, "53"),
        new("5313",  "مصاريف بنكية",                  "Bank Charges",           AccountCategory.Expense, false, "53"),
    };

    /// <summary>
    /// يبني كائنات ChartOfAccount جاهزة للحفظ لتينانت معين.
    /// يحل ParentId من ParentCode، ويحدد Nature تلقائياً، ويحسب Level.
    /// </summary>
    public static List<ChartOfAccount> BuildEntities(Guid tenantId)
    {
        var byCode = new Dictionary<string, ChartOfAccount>(StringComparer.Ordinal);
        var now = DateTime.UtcNow;

        foreach (var seed in Accounts)
        {
            var account = new ChartOfAccount
            {
                TenantId = tenantId,
                Code = seed.Code,
                NameAr = seed.NameAr,
                NameEn = seed.NameEn,
                Category = seed.Category,
                Nature = NatureFor(seed.Category),
                IsGroup = seed.IsGroup,
                IsSystem = true,
                IsActive = true,
                CreatedAt = now,
                Level = (byte)seed.Code.Length // simple depth: code length = depth
            };

            if (seed.ParentCode is not null && byCode.TryGetValue(seed.ParentCode, out var parent))
            {
                account.Parent = parent;
                account.Level = (byte)(parent.Level + 1);
            }

            byCode[seed.Code] = account;
        }

        return byCode.Values.ToList();
    }

    private static AccountNature NatureFor(AccountCategory category) => category switch
    {
        AccountCategory.Asset or AccountCategory.Expense => AccountNature.Debit,
        _ => AccountNature.Credit,
    };
}
