using Microsoft.AspNetCore.Mvc;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // TODO (Person 3): Inject AppDbContext and implement auth logic

    /// <summary>POST /api/auth/register</summary>
    [HttpPost("register")]
    public IActionResult Register()
    {
        // TODO (Person 3): Validate input, hash password, save user, return JWT
        return Ok(new { message = "Register endpoint — not yet implemented" });
    }

    /// <summary>POST /api/auth/login</summary>
    [HttpPost("login")]
    public IActionResult Login()
    {
        // TODO (Person 3): Validate credentials, issue JWT token
        return Ok(new { message = "Login endpoint — not yet implemented" });
    }
}
