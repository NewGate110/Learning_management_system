using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentController : ControllerBase
{
    // TODO (Person 3): Inject AppDbContext

    /// <summary>GET /api/assignment?courseId={id}</summary>
    [HttpGet]
    public IActionResult GetByCourse([FromQuery] int courseId) =>
        Ok(new { message = $"Get assignments for course {courseId} — not yet implemented" });

    /// <summary>GET /api/assignment/{id}</summary>
    [HttpGet("{id}")]
    public IActionResult GetById(int id) =>
        Ok(new { message = $"Get assignment {id} — not yet implemented" });

    /// <summary>POST /api/assignment</summary>
    [HttpPost]
    [Authorize(Roles = "Instructor,Admin")]
    public IActionResult Create() =>
        Ok(new { message = "Create assignment — not yet implemented" });

    /// <summary>PUT /api/assignment/{id}</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Instructor,Admin")]
    public IActionResult Update(int id) =>
        Ok(new { message = $"Update assignment {id} — not yet implemented" });

    /// <summary>DELETE /api/assignment/{id}</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Instructor,Admin")]
    public IActionResult Delete(int id) =>
        Ok(new { message = $"Delete assignment {id} — not yet implemented" });

    /// <summary>POST /api/assignment/{id}/submit</summary>
    [HttpPost("{id}/submit")]
    [Authorize(Roles = "Student")]
    public IActionResult Submit(int id) =>
        Ok(new { message = $"Submit assignment {id} — not yet implemented" });
}
