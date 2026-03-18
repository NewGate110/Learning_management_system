using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourseController : ControllerBase
{
    // TODO (Person 3): Inject AppDbContext

    /// <summary>GET /api/course</summary>
    [HttpGet]
    public IActionResult GetAll() =>
        Ok(new { message = "Get all courses — not yet implemented" });

    /// <summary>GET /api/course/{id}</summary>
    [HttpGet("{id}")]
    public IActionResult GetById(int id) =>
        Ok(new { message = $"Get course {id} — not yet implemented" });

    /// <summary>POST /api/course</summary>
    [HttpPost]
    [Authorize(Roles = "Instructor,Admin")]
    public IActionResult Create() =>
        Ok(new { message = "Create course — not yet implemented" });

    /// <summary>PUT /api/course/{id}</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Instructor,Admin")]
    public IActionResult Update(int id) =>
        Ok(new { message = $"Update course {id} — not yet implemented" });

    /// <summary>DELETE /api/course/{id}</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public IActionResult Delete(int id) =>
        Ok(new { message = $"Delete course {id} — not yet implemented" });
}
