using MsCashier.Domain.Enums.Accounting;

namespace MsCashier.Application.DTOs.Accounting;

public record JournalLineDto(
    int AccountId,
    decimal Debit,
    decimal Credit,
    string? Description = null,
    int? ContactId = null,
    int? BranchId = null,
    string? CostCenter = null);

public record CreateJournalEntryDto(
    DateTime EntryDate,
    JournalSource Source,
    IReadOnlyList<JournalLineDto> Lines,
    string? Reference = null,
    string? DescriptionAr = null,
    string? DescriptionEn = null,
    string? SourceType = null,
    long? SourceId = null,
    int? BranchId = null);
