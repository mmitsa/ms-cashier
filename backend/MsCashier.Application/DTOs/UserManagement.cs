using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// User Management
public record UpdateUserRequest(string? FullName, string? Phone, string? Email, string? Role, string? Password);
public record PermissionDto(string Permission, bool IsGranted);
public record UserDetailDto(Guid Id, string Username, string FullName, string? Phone, string? Email, string Role, bool IsActive, DateTime? LastLoginAt, List<PermissionDto> Permissions);

