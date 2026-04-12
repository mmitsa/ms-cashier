using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Auth
public record LoginRequest(string Username, string Password);
public record LoginResponse(string AccessToken, string RefreshToken, UserDto User);
public record RefreshTokenRequest(string RefreshToken);
public record ChangePasswordRequest(string OldPassword, string NewPassword);

