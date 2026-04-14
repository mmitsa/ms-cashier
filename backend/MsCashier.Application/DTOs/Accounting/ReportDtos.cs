using MsCashier.Domain.Enums.Accounting;

namespace MsCashier.Application.DTOs.Accounting;

public record TrialBalanceRowDto(
    string AccountCode,
    string AccountName,
    AccountCategory Category,
    decimal OpeningDebit,
    decimal OpeningCredit,
    decimal PeriodDebit,
    decimal PeriodCredit,
    decimal ClosingDebit,
    decimal ClosingCredit);

public record TrialBalanceDto(
    DateTime FromDate,
    DateTime ToDate,
    IReadOnlyList<TrialBalanceRowDto> Rows,
    decimal TotalDebit,
    decimal TotalCredit);

public record IncomeStatementLineDto(string AccountCode, string AccountName, decimal Amount);

public record IncomeStatementDto(
    DateTime FromDate,
    DateTime ToDate,
    IReadOnlyList<IncomeStatementLineDto> Revenues,
    decimal TotalRevenue,
    IReadOnlyList<IncomeStatementLineDto> Expenses,
    decimal TotalExpenses,
    decimal NetIncome);

public record BalanceSheetLineDto(string AccountCode, string AccountName, decimal Balance);

public record BalanceSheetDto(
    DateTime AsOfDate,
    IReadOnlyList<BalanceSheetLineDto> Assets,
    decimal TotalAssets,
    IReadOnlyList<BalanceSheetLineDto> Liabilities,
    decimal TotalLiabilities,
    IReadOnlyList<BalanceSheetLineDto> Equity,
    decimal TotalEquity,
    decimal RetainedEarnings,
    bool IsBalanced);

public record ContactStatementEntryDto(
    DateTime Date,
    string EntryNumber,
    string? Reference,
    string? Description,
    decimal Debit,
    decimal Credit,
    decimal RunningBalance);

public record ContactStatementDto(
    int ContactId,
    string ContactName,
    DateTime FromDate,
    DateTime ToDate,
    decimal OpeningBalance,
    IReadOnlyList<ContactStatementEntryDto> Entries,
    decimal ClosingBalance);
