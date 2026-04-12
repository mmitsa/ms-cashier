using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Infrastructure.Services;

public class TokenService : ITokenService
{
    public const string PermissionClaimType = "permission";

    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(User user)
        => GenerateAccessToken(user, permissions: null);

    /// <summary>
    /// Issue an access token, optionally embedding the user's granted
    /// permission keys as repeated <c>permission</c> claims. Authorization
    /// handlers can then check <c>User.HasClaim("permission", "products.delete")</c>
    /// without needing to round-trip the database on every request.
    /// </summary>
    public string GenerateAccessToken(User user, IEnumerable<string>? permissions)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured.");
        var issuer = _configuration["Jwt:Issuer"] ?? "MsCashier";
        var audience = _configuration["Jwt:Audience"] ?? "MsCashier";
        var expiryHours = int.TryParse(_configuration["Jwt:ExpiryHours"], out var h) ? h : 24;

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new("tenant_id", user.TenantId.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (permissions is not null)
        {
            foreach (var p in permissions)
            {
                if (!string.IsNullOrWhiteSpace(p))
                {
                    claims.Add(new Claim(PermissionClaimType, p));
                }
            }
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
