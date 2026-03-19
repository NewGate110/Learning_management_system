using CollegeLMS.API.Contracts;
using CollegeLMS.API.Data;
using CollegeLMS.API.Extensions;
using CollegeLMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourseController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CourseResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var courses = await db.Courses
            .AsNoTracking()
            .OrderBy(course => course.Title)
            .Select(course => new CourseResponse(
                course.Id,
                course.Title,
                course.Description,
                course.InstructorId,
                course.Instructor!.Name,
                course.Students.Count,
                course.Assignments.Count))
            .ToListAsync(cancellationToken);

        return Ok(courses);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CourseDetailResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var course = await db.Courses
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new CourseDetailResponse(
                item.Id,
                item.Title,
                item.Description,
                item.InstructorId,
                item.Instructor!.Name,
                item.Students.OrderBy(student => student.Id).Select(student => student.Id).ToList(),
                item.Assignments
                    .OrderBy(assignment => assignment.Deadline)
                    .Select(assignment => new AssignmentResponse(
                        assignment.Id,
                        assignment.Title,
                        assignment.Description,
                        assignment.Deadline,
                        assignment.CourseId,
                        assignment.Grades.Count))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        return course is null ? NotFound() : Ok(course);
    }

    [HttpPost]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<CourseDetailResponse>> Create(
        [FromBody] UpsertCourseRequest request,
        CancellationToken cancellationToken)
    {
        var actorId = User.GetUserId();
        var isAdmin = User.IsInRole(UserRoles.Admin);

        if (!isAdmin && actorId != request.InstructorId)
        {
            return Forbid();
        }

        var instructor = await db.Users
            .FirstOrDefaultAsync(user => user.Id == request.InstructorId, cancellationToken);

        if (instructor is null || instructor.Role is not (UserRoles.Instructor or UserRoles.Admin))
        {
            return BadRequest(new { message = "InstructorId must belong to an instructor or admin user." });
        }

        var students = await LoadStudentsAsync(request.StudentIds, cancellationToken);
        if (students is null)
        {
            return BadRequest(new { message = "One or more student IDs are invalid." });
        }

        var course = new Course
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            InstructorId = instructor.Id
        };

        foreach (var student in students)
        {
            course.Students.Add(student);
        }

        db.Courses.Add(course);
        await db.SaveChangesAsync(cancellationToken);

        await db.Entry(course).Reference(item => item.Instructor).LoadAsync(cancellationToken);
        await db.Entry(course).Collection(item => item.Students).LoadAsync(cancellationToken);
        await db.Entry(course).Collection(item => item.Assignments).LoadAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = course.Id }, ToDetailResponse(course));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<CourseDetailResponse>> Update(
        int id,
        [FromBody] UpsertCourseRequest request,
        CancellationToken cancellationToken)
    {
        var course = await db.Courses
            .Include(item => item.Instructor)
            .Include(item => item.Students)
            .Include(item => item.Assignments)
                .ThenInclude(assignment => assignment.Grades)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (course is null)
        {
            return NotFound();
        }

        var actorId = User.GetUserId();
        var isAdmin = User.IsInRole(UserRoles.Admin);

        if (!isAdmin && course.InstructorId != actorId)
        {
            return Forbid();
        }

        if (request.InstructorId != course.InstructorId)
        {
            if (!isAdmin)
            {
                return Forbid();
            }

            var newInstructor = await db.Users.FirstOrDefaultAsync(
                user => user.Id == request.InstructorId,
                cancellationToken);

            if (newInstructor is null || newInstructor.Role is not (UserRoles.Instructor or UserRoles.Admin))
            {
                return BadRequest(new { message = "InstructorId must belong to an instructor or admin user." });
            }

            course.InstructorId = newInstructor.Id;
            course.Instructor = newInstructor;
        }

        var students = await LoadStudentsAsync(request.StudentIds, cancellationToken);
        if (students is null)
        {
            return BadRequest(new { message = "One or more student IDs are invalid." });
        }

        course.Title = request.Title.Trim();
        course.Description = request.Description.Trim();
        course.Students.Clear();
        foreach (var student in students)
        {
            course.Students.Add(student);
        }

        await db.SaveChangesAsync(cancellationToken);

        return Ok(ToDetailResponse(course));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var course = await db.Courses.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (course is null)
        {
            return NotFound();
        }

        db.Courses.Remove(course);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<List<User>?> LoadStudentsAsync(
        IReadOnlyCollection<int> studentIds,
        CancellationToken cancellationToken)
    {
        var ids = studentIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return [];
        }

        var students = await db.Users
            .Where(user => ids.Contains(user.Id) && user.Role == UserRoles.Student)
            .ToListAsync(cancellationToken);

        return students.Count == ids.Count ? students : null;
    }

    private static CourseDetailResponse ToDetailResponse(Course course) =>
        new(
            course.Id,
            course.Title,
            course.Description,
            course.InstructorId,
            course.Instructor?.Name ?? string.Empty,
            course.Students.OrderBy(student => student.Id).Select(student => student.Id).ToList(),
            course.Assignments
                .OrderBy(assignment => assignment.Deadline)
                .Select(assignment => new AssignmentResponse(
                    assignment.Id,
                    assignment.Title,
                    assignment.Description,
                    assignment.Deadline,
                    assignment.CourseId,
                    assignment.Grades.Count))
                .ToList());
}
