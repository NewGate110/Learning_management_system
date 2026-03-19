using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CollegeLMS.API.Models;
using Microsoft.IdentityModel.Tokens;

namespace CollegeLMS.API.Services;

public class JwtTokenService(IConfiguration config)
{
    public (string Token, DateTime ExpiresAtUtc) CreateToken(User user)
    {
        var secret = config["JWT_SECRET"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException("JWT_SECRET is not configured.");
        }

        var issuer = config["JWT_ISSUER"] ?? "CollegeLMS";
        var audience = config["JWT_AUDIENCE"] ?? "CollegeLMSUsers";
        var expiryHours =
            double.TryParse(config["JWT_EXPIRY_HOURS"], out var configuredHours) &&
            configuredHours > 0
                ? configuredHours
                : 8;

        var expiresAtUtc = DateTime.UtcNow.AddHours(expiryHours);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
    }
}
