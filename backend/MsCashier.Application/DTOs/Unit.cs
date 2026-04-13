using MsCashier.Application.DTOs;

namespace MsCashier.Application.DTOs;

public record UnitDto(
    int Id,
    string Name,
    string? Symbol,
    bool IsBase,
    int? BaseUnitId,
    string? BaseUnitName,
    decimal? ConversionRate);

public record CreateUnitRequest(
    string Name,
    string? Symbol,
    bool IsBase = true,
    int? BaseUnitId = null,
    decimal? ConversionRate = null);

public record UpdateUnitRequest(
    string Name,
    string? Symbol,
    bool IsBase,
    int? BaseUnitId,
    decimal? ConversionRate);
