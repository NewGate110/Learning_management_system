using CollegeLMS.API.Data;
using CollegeLMS.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Services;

public class ModuleProgressService(AppDbContext db)
{
    private const double PassingGrade = 50;

    public async Task<ModuleProgress> RecalculateAsync(
        int moduleId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        var assignmentIds = await db.Assignments
            .AsNoTracking()
            .Where(assignment => assignment.ModuleId == moduleId)
            .Select(assignment => assignment.Id)
            .ToListAsync(cancellationToken);

        var assessmentIds = await db.Assessments
            .AsNoTracking()
            .Where(assessment => assessment.ModuleId == moduleId)
            .Select(assessment => assessment.Id)
            .ToListAsync(cancellationToken);

        var assignmentGrades = await db.AssignmentGrades
            .AsNoTracking()
            .Where(grade =>
                grade.Submission!.StudentId == studentId &&
                grade.Submission.Assignment!.ModuleId == moduleId)
            .Select(grade => new { grade.Score, grade.Submission!.AssignmentId })
            .ToListAsync(cancellationToken);

        var assessmentGrades = await db.AssessmentGrades
            .AsNoTracking()
            .Where(grade =>
                grade.StudentId == studentId &&
                grade.Assessment!.ModuleId == moduleId)
            .Select(grade => new { grade.Score, grade.AssessmentId })
            .ToListAsync(cancellationToken);

        var allAssignmentsGraded = assignmentIds.Count == 0 ||
            assignmentGrades.Select(item => item.AssignmentId).Distinct().Count() == assignmentIds.Count;
        var allAssessmentsGraded = assessmentIds.Count == 0 ||
            assessmentGrades.Select(item => item.AssessmentId).Distinct().Count() == assessmentIds.Count;

        var totalItems = assignmentIds.Count + assessmentIds.Count;
        var allGraded = totalItems > 0 && allAssignmentsGraded && allAssessmentsGraded;

        double? finalGrade = null;
        if (allGraded)
        {
            var allScores = assignmentGrades.Select(item => item.Score)
                .Concat(assessmentGrades.Select(item => item.Score))
                .ToList();

            if (allScores.Count > 0)
            {
                finalGrade = Math.Round(allScores.Average(), 2);
            }
        }

        var status = finalGrade switch
        {
            null => ModuleProgressStatuses.InProgress,
            >= PassingGrade => ModuleProgressStatuses.Passed,
            _ => ModuleProgressStatuses.Failed
        };

        var moduleProgress = await db.ModuleProgresses
            .FirstOrDefaultAsync(
                progress => progress.ModuleId == moduleId && progress.StudentId == studentId,
                cancellationToken);

        if (moduleProgress is null)
        {
            moduleProgress = new ModuleProgress
            {
                ModuleId = moduleId,
                StudentId = studentId
            };
            db.ModuleProgresses.Add(moduleProgress);
        }

        moduleProgress.Status = status;
        moduleProgress.FinalGrade = finalGrade;

        await db.SaveChangesAsync(cancellationToken);
        return moduleProgress;
    }

    public async Task<(int PassedRequiredModules, int TotalRequiredModules, bool IsCompleted)> GetCourseCompletionAsync(
        int courseId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        var modules = await db.Modules
            .AsNoTracking()
            .Where(module => module.CourseId == courseId)
            .OrderBy(module => module.Order)
            .Select(module => new { module.Id, module.Type, module.Order })
            .ToListAsync(cancellationToken);

        if (modules.Count == 0)
        {
            return (0, 0, false);
        }

        var progressByModuleId = await db.ModuleProgresses
            .AsNoTracking()
            .Where(progress =>
                progress.StudentId == studentId &&
                progress.Module!.CourseId == courseId)
            .ToDictionaryAsync(progress => progress.ModuleId, progress => progress.Status, cancellationToken);

        var requiredModules = modules
            .Where(module => module.Type is ModuleTypes.Sequential or ModuleTypes.Compulsory)
            .ToList();

        var passedRequired = requiredModules.Count(module =>
            progressByModuleId.TryGetValue(module.Id, out var status) && status == ModuleProgressStatuses.Passed);

        var sequentialModules = modules
            .Where(module => module.Type == ModuleTypes.Sequential)
            .OrderBy(module => module.Order)
            .ToList();

        var sequentialPasses = true;
        foreach (var module in sequentialModules)
        {
            if (!progressByModuleId.TryGetValue(module.Id, out var status) || status != ModuleProgressStatuses.Passed)
            {
                sequentialPasses = false;
                break;
            }
        }

        var compulsoryPasses = modules
            .Where(module => module.Type == ModuleTypes.Compulsory)
            .All(module =>
                progressByModuleId.TryGetValue(module.Id, out var status) && status == ModuleProgressStatuses.Passed);

        return (
            passedRequired,
            requiredModules.Count,
            sequentialPasses && compulsoryPasses);
    }
}
