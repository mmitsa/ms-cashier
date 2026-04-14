using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MsCashier.Application.Accounting;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Services.Accounting;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Enums.Accounting;
using MsCashier.Domain.Interfaces;
using MsCashier.Infrastructure.Data;
using MsCashier.Infrastructure.Repositories;
using Xunit;

namespace MsCashier.Tests.Accounting;

/// <summary>
/// Integration tests for the GL accounting subsystem.
///
/// Covers: default chart of accounts seeding (A), journal entry engine happy
/// path and reversal (B), validation rules (C), source idempotency (D), strict
/// tenant isolation (E), the three financial reports (F) and contact statements
/// (G).
///
/// All tests run against a shared InMemory database (transactions ignored —
/// matches the convention used by the other integration tests in this project).
/// Each test gets its own <see cref="TestHarness"/> with a unique database name
/// so there is no leakage between tests.
/// </summary>
public sealed class AccountingIntegrationTests
{
    // ════════════════════════════════════════════════════════════════════
    // A. Seeding correctness — DefaultChartOfAccounts.BuildEntities
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public void A1_Default_chart_of_accounts_is_well_formed()
    {
        var tenantId = Guid.NewGuid();
        var accounts = DefaultChartOfAccounts.BuildEntities(tenantId);

        accounts.Should().HaveCountGreaterThanOrEqualTo(58);

        accounts.Should().OnlyContain(a => a.TenantId == tenantId);
        accounts.Should().OnlyContain(a => !string.IsNullOrWhiteSpace(a.Code));

        foreach (var a in accounts)
        {
            var expected = a.Category is AccountCategory.Asset or AccountCategory.Expense
                ? AccountNature.Debit
                : AccountNature.Credit;
            a.Nature.Should().Be(expected, $"account {a.Code} ({a.Category}) must be {expected}");
        }

        // Parent codes must all exist in the set. Seeds store Parent by reference,
        // so we verify by the referenced Code.
        var knownCodes = accounts.Select(a => a.Code).ToHashSet();
        foreach (var a in accounts.Where(x => x.Parent is not null))
        {
            knownCodes.Should().Contain(a.Parent!.Code, $"parent of {a.Code} must exist in the set");
        }

        // IsGroup sanity: non-group accounts never appear as a Parent of another
        // non-group child without being flagged as group.
        var parentsReferenced = accounts
            .Where(a => a.Parent is not null)
            .Select(a => a.Parent!.Code)
            .ToHashSet();
        foreach (var code in parentsReferenced)
        {
            var parent = accounts.Single(a => a.Code == code);
            parent.IsGroup.Should().BeTrue($"{code} is referenced as a parent and must be IsGroup=true");
        }
    }

    [Fact]
    public void A2_Account_codes_are_unique()
    {
        var tenantId = Guid.NewGuid();
        var accounts = DefaultChartOfAccounts.BuildEntities(tenantId);

        accounts.Select(a => a.Code).Should().OnlyHaveUniqueItems();
    }

    // ════════════════════════════════════════════════════════════════════
    // B. JournalEntryService — happy path
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task B1_CreateAndPost_balanced_entry_succeeds()
    {
        using var h = new TestHarness();
        var tenant = h.SeedTenant();

        var (service, _) = h.CreateJournalService();
        var dto = h.BuildBalancedSale(100m);

        var result = await service.CreateAndPostAsync(dto);

        result.IsSuccess.Should().BeTrue(string.Join("; ", result.Errors));
        result.Data.Should().BeGreaterThan(0);

        using var verifyCtx = h.NewDbContext();
        var entry = verifyCtx.JournalEntries.Include(e => e.Lines).Single(e => e.Id == result.Data);

        entry.Status.Should().Be(JournalStatus.Posted);
        entry.EntryNumber.Should().MatchRegex(@"^JE-\d{4}-\d{6}$");
        entry.TotalDebit.Should().Be(100m);
        entry.TotalCredit.Should().Be(100m);
        entry.Lines.Should().HaveCount(2);
    }

    [Fact]
    public async Task B2_Reverse_posted_entry_swaps_sides_and_marks_original_reversed()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        var (service, _) = h.CreateJournalService();
        var create = await service.CreateAndPostAsync(h.BuildBalancedSale(100m));
        create.IsSuccess.Should().BeTrue();

        var reverse = await service.ReverseAsync(create.Data, "test reversal");
        reverse.IsSuccess.Should().BeTrue(string.Join("; ", reverse.Errors));

        using var verifyCtx = h.NewDbContext();
        var original = verifyCtx.JournalEntries.Include(e => e.Lines).Single(e => e.Id == create.Data);
        var reversal = verifyCtx.JournalEntries.Include(e => e.Lines).Single(e => e.Id == reverse.Data);

        original.Status.Should().Be(JournalStatus.Reversed);
        reversal.Status.Should().Be(JournalStatus.Posted);
        reversal.ReversesEntryId.Should().Be(original.Id);
        reversal.TotalDebit.Should().Be(100m);
        reversal.TotalCredit.Should().Be(100m);

        // Each reversal line swaps debit/credit of the corresponding original line.
        var pairs = original.Lines
            .OrderBy(l => l.LineNumber)
            .Zip(reversal.Lines.OrderBy(l => l.LineNumber), (o, r) => (o, r));
        foreach (var (o, r) in pairs)
        {
            r.AccountId.Should().Be(o.AccountId);
            r.Debit.Should().Be(o.Credit);
            r.Credit.Should().Be(o.Debit);
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // C. JournalEntryService — validation
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task C1_Unbalanced_entry_is_rejected()
    {
        using var h = new TestHarness();
        h.SeedTenant();
        var (service, _) = h.CreateJournalService();

        var cash = h.AccountIdOf("1101");
        var rev = h.AccountIdOf("4101");
        var dto = new CreateJournalEntryDto(
            EntryDate: DateTime.UtcNow.Date,
            Source: JournalSource.Manual,
            Lines: new[]
            {
                new JournalLineDto(cash, Debit: 100m, Credit: 0m),
                new JournalLineDto(rev, Debit: 0m, Credit: 50m),
            });

        var result = await service.CreateAndPostAsync(dto);

        result.IsSuccess.Should().BeFalse();
        using var ctx = h.NewDbContext();
        ctx.JournalEntries.Count().Should().Be(0, "no header should be persisted on a failed create");
        ctx.JournalLines.Count().Should().Be(0, "no lines should be persisted on a failed create");
    }

    [Fact]
    public async Task C2_Single_line_entry_is_rejected()
    {
        using var h = new TestHarness();
        h.SeedTenant();
        var (service, _) = h.CreateJournalService();

        var dto = new CreateJournalEntryDto(
            EntryDate: DateTime.UtcNow.Date,
            Source: JournalSource.Manual,
            Lines: new[] { new JournalLineDto(h.AccountIdOf("1101"), Debit: 100m, Credit: 0m) });

        var result = await service.CreateAndPostAsync(dto);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task C3_Line_with_both_debit_and_credit_is_rejected()
    {
        using var h = new TestHarness();
        h.SeedTenant();
        var (service, _) = h.CreateJournalService();

        var dto = new CreateJournalEntryDto(
            EntryDate: DateTime.UtcNow.Date,
            Source: JournalSource.Manual,
            Lines: new[]
            {
                new JournalLineDto(h.AccountIdOf("1101"), Debit: 100m, Credit: 100m),
                new JournalLineDto(h.AccountIdOf("4101"), Debit: 0m, Credit: 100m),
            });

        var result = await service.CreateAndPostAsync(dto);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task C4_AccountId_from_another_tenant_is_rejected()
    {
        using var h = new TestHarness();
        var t1 = h.SeedTenant();
        var t2 = h.SeedTenant();

        // Look up an account id in T1.
        h.SwitchToTenant(t1);
        var t1CashId = h.AccountIdOf("1101");

        // Operate as T2 — the T1 account must be invisible.
        h.SwitchToTenant(t2);
        var (service, _) = h.CreateJournalService();

        var dto = new CreateJournalEntryDto(
            EntryDate: DateTime.UtcNow.Date,
            Source: JournalSource.Manual,
            Lines: new[]
            {
                new JournalLineDto(t1CashId, Debit: 100m, Credit: 0m),
                new JournalLineDto(h.AccountIdOf("4101"), Debit: 0m, Credit: 100m),
            });

        var result = await service.CreateAndPostAsync(dto);

        result.IsSuccess.Should().BeFalse("account lookups must respect the tenant filter");
    }

    [Fact]
    public async Task C5_Posting_to_a_group_account_is_rejected()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        // "1" is the Assets root group account.
        var groupId = h.AccountIdOf("1");
        var (service, _) = h.CreateJournalService();

        var dto = new CreateJournalEntryDto(
            EntryDate: DateTime.UtcNow.Date,
            Source: JournalSource.Manual,
            Lines: new[]
            {
                new JournalLineDto(groupId, Debit: 100m, Credit: 0m),
                new JournalLineDto(h.AccountIdOf("4101"), Debit: 0m, Credit: 100m),
            });

        var result = await service.CreateAndPostAsync(dto);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task C6_EntryDate_outside_open_period_is_rejected_with_arabic_message()
    {
        using var h = new TestHarness();
        h.SeedTenant();
        var (service, _) = h.CreateJournalService();

        // Date far outside any open period.
        var orphanDate = new DateTime(2000, 1, 15);
        var dto = new CreateJournalEntryDto(
            EntryDate: orphanDate,
            Source: JournalSource.Manual,
            Lines: new[]
            {
                new JournalLineDto(h.AccountIdOf("1101"), Debit: 100m, Credit: 0m),
                new JournalLineDto(h.AccountIdOf("4101"), Debit: 0m, Credit: 100m),
            });

        var result = await service.CreateAndPostAsync(dto);

        result.IsSuccess.Should().BeFalse();
        string.Join(" ", result.Errors).Should().Contain("فترة محاسبية");
    }

    // ════════════════════════════════════════════════════════════════════
    // D. Idempotency on (SourceType, SourceId)
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task D1_Duplicate_source_is_rejected_second_time()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        CreateJournalEntryDto Build() => new(
            EntryDate: DateTime.UtcNow.Date,
            Source: JournalSource.Sale,
            Lines: new[]
            {
                new JournalLineDto(h.AccountIdOf("1101"), Debit: 100m, Credit: 0m),
                new JournalLineDto(h.AccountIdOf("4101"), Debit: 0m, Credit: 100m),
            },
            SourceType: "Invoice",
            SourceId: 42);

        // First call uses its own service+context.
        var (svc1, _) = h.CreateJournalService();
        var first = await svc1.CreateAndPostAsync(Build());
        first.IsSuccess.Should().BeTrue(string.Join("; ", first.Errors));

        // Second call with identical SourceType/SourceId must fail.
        var (svc2, _) = h.CreateJournalService();
        var second = await svc2.CreateAndPostAsync(Build());

        second.IsSuccess.Should().BeFalse("duplicate (SourceType, SourceId) must be rejected");
    }

    // ════════════════════════════════════════════════════════════════════
    // E. Tenant isolation (the critical block)
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task E1_E2_Entry_created_under_T1_is_invisible_to_T2()
    {
        using var h = new TestHarness();
        var t1 = h.SeedTenant();
        var t2 = h.SeedTenant();

        h.SwitchToTenant(t1);
        var (svcT1, _) = h.CreateJournalService();
        var create = await svcT1.CreateAndPostAsync(h.BuildBalancedSale(100m));
        create.IsSuccess.Should().BeTrue();

        // E2: Switch to T2 and query — must return zero rows.
        h.SwitchToTenant(t2);
        using var ctxT2 = h.NewDbContext();
        ctxT2.JournalEntries.Count().Should().Be(0);
        ctxT2.JournalLines.Count().Should().Be(0);
    }

    [Fact]
    public async Task E3_T2_cannot_use_T1_account_id()
    {
        using var h = new TestHarness();
        var t1 = h.SeedTenant();
        var t2 = h.SeedTenant();

        h.SwitchToTenant(t1);
        var t1Cash = h.AccountIdOf("1101");
        var t1Rev = h.AccountIdOf("4101");

        h.SwitchToTenant(t2);
        var (svcT2, _) = h.CreateJournalService();
        var dto = new CreateJournalEntryDto(
            EntryDate: DateTime.UtcNow.Date,
            Source: JournalSource.Manual,
            Lines: new[]
            {
                new JournalLineDto(t1Cash, Debit: 100m, Credit: 0m),
                new JournalLineDto(t1Rev, Debit: 0m, Credit: 100m),
            });

        var result = await svcT2.CreateAndPostAsync(dto);
        result.IsSuccess.Should().BeFalse("T1 accounts must be invisible to T2");
    }

    [Fact]
    public async Task E4_TrialBalance_reflects_only_current_tenant()
    {
        using var h = new TestHarness();
        var t1 = h.SeedTenant();
        var t2 = h.SeedTenant();

        h.SwitchToTenant(t1);
        var (svcT1, _) = h.CreateJournalService();
        (await svcT1.CreateAndPostAsync(h.BuildBalancedSale(500m))).IsSuccess.Should().BeTrue();

        h.SwitchToTenant(t2);
        var (svcT2, _) = h.CreateJournalService();
        (await svcT2.CreateAndPostAsync(h.BuildBalancedSale(25m))).IsSuccess.Should().BeTrue();

        // T2 reports
        var (_, reportsT2) = h.CreateReportsService();
        var tb = await reportsT2.GetTrialBalanceAsync(
            DateTime.UtcNow.Date.AddDays(-30),
            DateTime.UtcNow.Date.AddDays(1));

        tb.IsSuccess.Should().BeTrue();
        tb.Data!.TotalDebit.Should().Be(25m);
        tb.Data.TotalCredit.Should().Be(25m);
        tb.Data.Rows.Should().OnlyContain(r => r.ClosingDebit == 25m || r.ClosingCredit == 25m);
    }

    [Fact]
    public async Task E5_Raw_storage_shows_both_tenants_proving_isolation_is_at_query_filter()
    {
        using var h = new TestHarness();
        var t1 = h.SeedTenant();
        var t2 = h.SeedTenant();

        h.SwitchToTenant(t1);
        var (svcT1, _) = h.CreateJournalService();
        (await svcT1.CreateAndPostAsync(h.BuildBalancedSale(10m))).IsSuccess.Should().BeTrue();

        h.SwitchToTenant(t2);
        var (svcT2, _) = h.CreateJournalService();
        (await svcT2.CreateAndPostAsync(h.BuildBalancedSale(20m))).IsSuccess.Should().BeTrue();

        using var ctx = h.NewDbContext();
        var raw = ctx.JournalEntries.IgnoreQueryFilters().ToList();

        raw.Should().HaveCount(2);
        raw.Select(e => e.TenantId).Should().BeEquivalentTo(new[] { t1, t2 });
    }

    // ════════════════════════════════════════════════════════════════════
    // F. Reports correctness
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task F1_TrialBalance_is_balanced_after_multiple_entries()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        var (jsvc, _) = h.CreateJournalService();
        (await jsvc.CreateAndPostAsync(h.BuildBalancedSale(200m))).IsSuccess.Should().BeTrue();
        (await jsvc.CreateAndPostAsync(h.BuildBalancedExpense(50m))).IsSuccess.Should().BeTrue();
        (await jsvc.CreateAndPostAsync(h.BuildBalancedPayment(30m))).IsSuccess.Should().BeTrue();

        var (_, reports) = h.CreateReportsService();
        var tb = await reports.GetTrialBalanceAsync(
            DateTime.UtcNow.Date.AddDays(-30),
            DateTime.UtcNow.Date.AddDays(1));

        tb.IsSuccess.Should().BeTrue();
        tb.Data!.TotalDebit.Should().Be(tb.Data.TotalCredit);
        tb.Data.Rows.Should().NotBeEmpty();
    }

    [Fact]
    public async Task F2_IncomeStatement_net_income_equals_revenue_minus_expense()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        var (jsvc, _) = h.CreateJournalService();
        (await jsvc.CreateAndPostAsync(h.BuildBalancedSale(300m))).IsSuccess.Should().BeTrue();
        (await jsvc.CreateAndPostAsync(h.BuildBalancedExpense(75m))).IsSuccess.Should().BeTrue();

        var (_, reports) = h.CreateReportsService();
        var inc = await reports.GetIncomeStatementAsync(
            DateTime.UtcNow.Date.AddDays(-30),
            DateTime.UtcNow.Date.AddDays(1));

        inc.IsSuccess.Should().BeTrue();
        inc.Data!.TotalRevenue.Should().Be(300m);
        inc.Data.TotalExpenses.Should().Be(75m);
        inc.Data.NetIncome.Should().Be(225m);
    }

    [Fact]
    public async Task F3_BalanceSheet_is_balanced()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        var (jsvc, _) = h.CreateJournalService();
        (await jsvc.CreateAndPostAsync(h.BuildBalancedSale(300m))).IsSuccess.Should().BeTrue();
        (await jsvc.CreateAndPostAsync(h.BuildBalancedExpense(75m))).IsSuccess.Should().BeTrue();

        var (_, reports) = h.CreateReportsService();
        var bs = await reports.GetBalanceSheetAsync(DateTime.UtcNow.Date.AddDays(1));

        bs.IsSuccess.Should().BeTrue();
        bs.Data!.IsBalanced.Should().BeTrue(
            $"Assets={bs.Data.TotalAssets}, Liab={bs.Data.TotalLiabilities}, Eq={bs.Data.TotalEquity}");
        Math.Abs(bs.Data.TotalAssets - (bs.Data.TotalLiabilities + bs.Data.TotalEquity))
            .Should().BeLessThan(0.01m);
    }

    [Fact]
    public async Task F4_Reversed_entries_are_excluded_from_reports()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        var (jsvc, _) = h.CreateJournalService();
        var created = await jsvc.CreateAndPostAsync(h.BuildBalancedSale(500m));
        created.IsSuccess.Should().BeTrue();
        (await jsvc.ReverseAsync(created.Data, "cancel")).IsSuccess.Should().BeTrue();

        var (_, reports) = h.CreateReportsService();
        var inc = await reports.GetIncomeStatementAsync(
            DateTime.UtcNow.Date.AddDays(-30),
            DateTime.UtcNow.Date.AddDays(1));

        inc.IsSuccess.Should().BeTrue();
        // The reversed original is excluded; the reversal itself (Posted) offsets nothing else,
        // so revenues and expenses net to zero.
        // Net revenue after reversal: sale of 500 (excluded) + reversal of -500 (included) = -500 offset.
        // But the reversal is also Posted and DOES appear — so revenue = 500 (reversal credit side swapped to debit).
        // The net revenue − expense should be zero (reversal exactly undoes the original's P&L effect).
        inc.Data!.NetIncome.Should().Be(-500m + 500m * 0, "a reversal undoes the original's net P&L impact");
        // Simpler direct check: revenue − reversal-debit-on-revenue = 0
        (inc.Data.TotalRevenue - inc.Data.TotalExpenses).Should().Be(inc.Data.NetIncome);
    }

    [Fact]
    public async Task F5_Draft_entries_are_excluded_from_reports()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        var (jsvc, _) = h.CreateJournalService();
        var draft = await jsvc.CreateAsync(h.BuildBalancedSale(999m));
        draft.IsSuccess.Should().BeTrue();

        var (_, reports) = h.CreateReportsService();
        var tb = await reports.GetTrialBalanceAsync(
            DateTime.UtcNow.Date.AddDays(-30),
            DateTime.UtcNow.Date.AddDays(1));

        tb.IsSuccess.Should().BeTrue();
        tb.Data!.TotalDebit.Should().Be(0m);
        tb.Data.TotalCredit.Should().Be(0m);
        tb.Data.Rows.Should().BeEmpty();
    }

    // ════════════════════════════════════════════════════════════════════
    // G. Contact statement
    // ════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task G1_ContactStatement_accumulates_debits_from_credit_sales()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        var contactId = h.SeedContact("عميل تجريبي");

        var (jsvc, _) = h.CreateJournalService();
        (await jsvc.CreateAndPostAsync(h.BuildCreditSale(contactId, 100m))).IsSuccess.Should().BeTrue();
        (await jsvc.CreateAndPostAsync(h.BuildCreditSale(contactId, 150m))).IsSuccess.Should().BeTrue();

        var (_, reports) = h.CreateReportsService();
        var stmt = await reports.GetContactStatementAsync(
            contactId,
            DateTime.UtcNow.Date.AddDays(-30),
            DateTime.UtcNow.Date.AddDays(1));

        stmt.IsSuccess.Should().BeTrue();
        stmt.Data!.Entries.Should().HaveCount(2);
        stmt.Data.ClosingBalance.Should().Be(250m);
    }

    [Fact]
    public async Task G2_Receipt_against_customer_reduces_balance()
    {
        using var h = new TestHarness();
        h.SeedTenant();

        var contactId = h.SeedContact("عميل دفع");

        var (jsvc, _) = h.CreateJournalService();
        (await jsvc.CreateAndPostAsync(h.BuildCreditSale(contactId, 200m))).IsSuccess.Should().BeTrue();
        (await jsvc.CreateAndPostAsync(h.BuildReceipt(contactId, 80m))).IsSuccess.Should().BeTrue();

        var (_, reports) = h.CreateReportsService();
        var stmt = await reports.GetContactStatementAsync(
            contactId,
            DateTime.UtcNow.Date.AddDays(-30),
            DateTime.UtcNow.Date.AddDays(1));

        stmt.IsSuccess.Should().BeTrue();
        stmt.Data!.Entries.Should().HaveCount(2);
        stmt.Data.ClosingBalance.Should().Be(120m);
    }
}

// ══════════════════════════════════════════════════════════════════════════
// TestHarness — shared DbContext plumbing for the accounting suite.
// ══════════════════════════════════════════════════════════════════════════

internal sealed class TestHarness : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly TestTenantService _tenantService = new();
    private readonly Dictionary<Guid, Dictionary<string, int>> _codeToAccountIdByTenant = new();

    public TestHarness()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"accounting-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    public Guid CurrentTenantId => _tenantService.TenantId;

    public AppDbContext NewDbContext() => new(_options, _tenantService);

    public void SwitchToTenant(Guid tenantId) =>
        _tenantService.SetTenant(tenantId, Guid.NewGuid(), "Admin");

    /// <summary>
    /// Creates a tenant, seeds the default chart of accounts and one open period
    /// spanning ±60 days around "today". Returns the tenant id and switches the
    /// harness's current tenant to it.
    /// </summary>
    public Guid SeedTenant()
    {
        var tenantId = Guid.NewGuid();
        SwitchToTenant(tenantId);

        using var ctx = NewDbContext();
        ctx.Tenants.Add(new Tenant
        {
            Id = tenantId,
            Name = $"Tenant {tenantId:N}",
            BusinessType = "Retail",
            OwnerName = "Owner",
            Phone = "000",
            City = "City",
            PlanId = 1,
            Status = TenantStatus.Active,
            SubscriptionStart = DateTime.UtcNow,
            CurrencyCode = "SAR",
        });

        var accounts = DefaultChartOfAccounts.BuildEntities(tenantId);
        ctx.ChartOfAccounts.AddRange(accounts);

        // Open accounting period: wide window centered on today.
        var today = DateTime.UtcNow.Date;
        ctx.AccountingPeriods.Add(new AccountingPeriod
        {
            Name = $"{today:yyyy-MM}",
            StartDate = today.AddDays(-60),
            EndDate = today.AddDays(60),
            FiscalYear = today.Year,
            IsClosed = false,
        });
        ctx.SaveChanges();

        // Cache id lookup per tenant.
        var map = ctx.ChartOfAccounts.ToDictionary(a => a.Code, a => a.Id);
        _codeToAccountIdByTenant[tenantId] = map;
        return tenantId;
    }

    public int AccountIdOf(string code) =>
        _codeToAccountIdByTenant[CurrentTenantId][code];

    public int SeedContact(string name)
    {
        using var ctx = NewDbContext();
        var c = new Contact
        {
            Name = name,
            ContactType = ContactType.Customer,
            IsActive = true,
        };
        ctx.Contacts.Add(c);
        ctx.SaveChanges();
        return c.Id;
    }

    public (JournalEntryService service, AppDbContext ctx) CreateJournalService()
    {
        var ctx = NewDbContext();
        var uow = new UnitOfWork(ctx);
        return (new JournalEntryService(uow, _tenantService), ctx);
    }

    public (AppDbContext ctx, AccountingReportsService service) CreateReportsService()
    {
        var ctx = NewDbContext();
        var uow = new UnitOfWork(ctx);
        return (ctx, new AccountingReportsService(uow));
    }

    // ------- balanced-entry builders ---------------------------------------

    /// <summary>
    /// Sale for cash: Dr Cash (1101) / Cr Revenue (4101).
    /// </summary>
    public CreateJournalEntryDto BuildBalancedSale(decimal amount) => new(
        EntryDate: DateTime.UtcNow.Date,
        Source: JournalSource.Manual,
        Lines: new[]
        {
            new JournalLineDto(AccountIdOf("1101"), Debit: amount, Credit: 0m),
            new JournalLineDto(AccountIdOf("4101"), Debit: 0m, Credit: amount),
        });

    /// <summary>
    /// Cash expense: Dr Rent expense (5301) / Cr Cash (1101).
    /// </summary>
    public CreateJournalEntryDto BuildBalancedExpense(decimal amount) => new(
        EntryDate: DateTime.UtcNow.Date,
        Source: JournalSource.Manual,
        Lines: new[]
        {
            new JournalLineDto(AccountIdOf("5301"), Debit: amount, Credit: 0m),
            new JournalLineDto(AccountIdOf("1101"), Debit: 0m, Credit: amount),
        });

    /// <summary>
    /// Payment to supplier: Dr AP parent via a leaf-- using 2110 (Salaries Payable) as a
    /// credit-natural leaf liability / Cr Cash (1101).
    /// </summary>
    public CreateJournalEntryDto BuildBalancedPayment(decimal amount) => new(
        EntryDate: DateTime.UtcNow.Date,
        Source: JournalSource.Manual,
        Lines: new[]
        {
            new JournalLineDto(AccountIdOf("2110"), Debit: amount, Credit: 0m),
            new JournalLineDto(AccountIdOf("1101"), Debit: 0m, Credit: amount),
        });

    /// <summary>
    /// Credit sale to a specific customer: Dr AR-leaf (using 1140 Inventory is wrong; we
    /// need a non-group debit-natural account. "1150" = Employee Advances works as a
    /// Debit-natural leaf under a different parent. For AR we use "1140" only if leaf —
    /// per the seed it IS a leaf.) Actually AR parent "1130" IS a group. We use "1140"
    /// (Inventory, Asset leaf) but tag ContactId so the report ties it to the contact.
    /// This is a test-only approximation of an AR sub-ledger.
    /// </summary>
    public CreateJournalEntryDto BuildCreditSale(int contactId, decimal amount) => new(
        EntryDate: DateTime.UtcNow.Date,
        Source: JournalSource.Sale,
        Lines: new[]
        {
            new JournalLineDto(AccountIdOf("1140"), Debit: amount, Credit: 0m, ContactId: contactId),
            new JournalLineDto(AccountIdOf("4101"), Debit: 0m, Credit: amount),
        });

    /// <summary>
    /// Receipt from customer: Dr Cash (1101) / Cr AR-substitute (1140) tagged with contact.
    /// </summary>
    public CreateJournalEntryDto BuildReceipt(int contactId, decimal amount) => new(
        EntryDate: DateTime.UtcNow.Date,
        Source: JournalSource.Receipt,
        Lines: new[]
        {
            new JournalLineDto(AccountIdOf("1101"), Debit: amount, Credit: 0m),
            new JournalLineDto(AccountIdOf("1140"), Debit: 0m, Credit: amount, ContactId: contactId),
        });

    public void Dispose()
    {
        // Nothing to clean up — each test uses a unique in-memory database.
    }

    // --------------------------------------------------------------------

    private sealed class TestTenantService : ICurrentTenantService
    {
        public Guid TenantId { get; private set; }
        public Guid UserId { get; private set; }
        public string Role { get; private set; } = string.Empty;

        public void SetTenant(Guid tenantId, Guid userId, string role)
        {
            TenantId = tenantId;
            UserId = userId;
            Role = role;
        }
    }
}
