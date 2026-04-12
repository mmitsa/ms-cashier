using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// User
public record UserDto(Guid Id, string Username, string FullName, string? Phone, string? Email, string Role, bool IsActive, DateTime? LastLoginAt);
public record CreateUserRequest(string Username, string Password, string FullName, string? Phone, string? Email, string Role, List<string>? Permissions);

