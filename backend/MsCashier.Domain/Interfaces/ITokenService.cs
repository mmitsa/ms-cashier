namespace MsCashier.Domain.Interfaces;

using MsCashier.Domain.Entities;

public interface ITokenService
{
    string GenerateAccessToken(User user);

    /// <summary>
    /// Issue an access token with the supplied permission keys embedded as
    /// JWT claims. Use this overload from AuthService.LoginAsync after
    /// loading the user's UserPermission rows.
    /// </summary>
    string GenerateAccessToken(User user, IEnumerable<string>? permissions);

    string GenerateRefreshToken();
}
