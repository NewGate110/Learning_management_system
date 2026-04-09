using System.ComponentModel.DataAnnotations;

namespace CollegeLMS.API.Contracts;

public sealed record GradeAssignmentSubmissionRequest
{
    [Range(1, int.MaxValue)]
    public int SubmissionId { get; init; }

    [Range(0, 100)]
    public double Score { get; init; }

    [StringLength(2000)]
    public string Feedback { get; init; } = string.Empty;
}

public sealed record UpdateAssignmentGradeRequest
{
    [Range(0, 100)]
    public double Score { get; init; }

    [StringLength(2000)]
    public string Feedback { get; init; } = string.Empty;
}

public sealed record GradeAssessmentRequest
{
    [Range(1, int.MaxValue)]
    public int AssessmentId { get; init; }

    [Range(1, int.MaxValue)]
    public int StudentId { get; init; }

    [Range(0, 100)]
    public double Score { get; init; }
}

public sealed record UpdateAssessmentGradeRequest
{
    [Range(0, 100)]
    public double Score { get; init; }
}

public sealed record AssignmentGradeResponse(
    int Id,
    int SubmissionId,
    int AssignmentId,
    int ModuleId,
    int StudentId,
    int InstructorId,
    double Score,
    string Feedback,
    DateTime GradedAt);

public sealed record AssessmentGradeResponse(
    int Id,
    int AssessmentId,
    int ModuleId,
    int StudentId,
    int InstructorId,
    double Score,
    DateTime GradedAt);

public sealed record ModuleFinalGradeResponse(
    int ModuleId,
    int StudentId,
    string Status,
    double? FinalGrade,
    bool IsReleased);

public sealed record ModuleGradeReleaseResponse(
    int ModuleId,
    int ReleasedStudentCount,
    int AlreadyReleasedStudentCount);
