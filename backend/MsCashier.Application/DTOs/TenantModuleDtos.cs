namespace MsCashier.Application.DTOs;

public record TenantModuleDto(
    string Key,
    string NameAr,
    string Category,
    bool IsEnabled,
    DateTime? EnabledAt);

public record UpdateTenantModulesRequest(List<TenantModuleToggleDto> Modules);

public record TenantModuleToggleDto(string Key, bool IsEnabled);
