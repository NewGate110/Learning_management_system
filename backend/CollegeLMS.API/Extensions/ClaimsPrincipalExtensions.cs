using System.Security.Claims;
using CollegeLMS.API.Models;

namespace CollegeLMS.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int? GetUserId(this ClaimsPrincipal principal)
    {
        var rawValue =
            principal.FindFirstValue(ClaimTypes.NameIdentifier) ??
            principal.FindFirstValue("sub");

        return int.TryParse(rawValue, out var userId) ? userId : null;
    }

    public static bool CanAccessUser(this ClaimsPrincipal principal, int userId) =>
        principal.IsInRole(UserRoles.Admin) || principal.GetUserId() == userId;
}
