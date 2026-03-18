using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    // TODO (Person 3): Inject AppDbContext

    /// <summary>GET /api/user — Admin only</summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public IActionResult GetAll() =>
        Ok(new { message = "Get all users — not yet implemented" });

    /// <summary>GET /api/user/{id}</summary>
    [HttpGet("{id}")]
    public IActionResult GetById(int id) =>
        Ok(new { message = $"Get user {id} — not yet implemented" });

    /// <summary>PUT /api/user/{id}</summary>
    [HttpPut("{id}")]
    public IActionResult Update(int id) =>
        Ok(new { message = $"Update user {id} — not yet implemented" });
}
