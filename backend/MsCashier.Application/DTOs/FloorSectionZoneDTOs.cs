using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Floor Section (Zone) DTOs
// ============================================================

public record FloorSectionDto(
    int Id, string Name, string? Description, string Color, string Icon,
    int SortOrder, bool IsActive, bool IsOutdoor, bool HasAC,
    bool IsSmokingAllowed, bool IsVIP, int? BranchId,
    decimal? ServiceChargePercent, int? MaxCapacity,
    string? OperatingHours,
    int TableCount, int OccupiedCount, int AvailableCount, int TotalCapacity);

public record SaveFloorSectionRequest(
    string Name, string? Description, string? Color, string? Icon,
    int SortOrder, bool IsActive, bool IsOutdoor, bool HasAC,
    bool IsSmokingAllowed, bool IsVIP, int? BranchId,
    decimal? ServiceChargePercent, int? MaxCapacity,
    string? OperatingHours);

public record FloorOverviewDto(
    List<FloorSectionDto> Sections,
    int TotalTables, int OccupiedTables, int AvailableTables,
    int TotalCapacity, int CurrentGuests);

