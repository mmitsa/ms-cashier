using MsCashier.Application.DTOs.Accounting;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces.Accounting;

public interface IJournalEntryService
{
    /// <summary>Creates a new Draft journal entry after validating balance, lines and accounts.</summary>
    Task<Result<long>> CreateAsync(CreateJournalEntryDto dto, CancellationToken ct = default);

    /// <summary>Transitions a Draft entry to Posted. Fails if the period is closed.</summary>
    Task<Result> PostAsync(long entryId, CancellationToken ct = default);

    /// <summary>Convenience: Create + Post atomically.</summary>
    Task<Result<long>> CreateAndPostAsync(CreateJournalEntryDto dto, CancellationToken ct = default);

    /// <summary>Posts a new reversing entry for a Posted entry. Marks the original as Reversed.</summary>
    Task<Result<long>> ReverseAsync(long entryId, string reasonAr, CancellationToken ct = default);
}
