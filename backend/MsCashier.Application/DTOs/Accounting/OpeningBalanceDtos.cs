namespace MsCashier.Application.DTOs.Accounting;

/// <summary>
/// One row of the opening-balance import.
/// <para>Balance &gt; 0 = customer owes us (Debit AR).</para>
/// <para>Balance &lt; 0 = we owe supplier (Credit AP).</para>
/// <para>The absolute value is posted; the sign picks the side.</para>
/// </summary>
public record OpeningBalanceRowDto(int ContactId, decimal Balance);

public record ImportOpeningBalancesRequest(
    DateTime OpeningDate,
    string? Description,
    IReadOnlyList<OpeningBalanceRowDto> Rows);

public record OpeningBalanceImportResultDto(
    int RowsProcessed,
    int RowsPosted,
    int RowsSkipped,
    decimal TotalDebit,
    decimal TotalCredit,
    IReadOnlyList<string> Errors);
