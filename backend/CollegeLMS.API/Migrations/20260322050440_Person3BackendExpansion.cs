using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CollegeLMS.API.Migrations
{
    /// <inheritdoc />
    public partial class Person3BackendExpansion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Courses_CourseId",
                table: "Assignments");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_UserId_AssignmentId",
                table: "Notifications");

            migrationBuilder.RenameColumn(
                name: "CourseId",
                table: "Assignments",
                newName: "ModuleId");

            migrationBuilder.RenameIndex(
                name: "IX_Assignments_CourseId_Deadline",
                table: "Assignments",
                newName: "IX_Assignments_ModuleId_Deadline");

            migrationBuilder.AddColumn<int>(
                name: "AssessmentId",
                table: "Notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ModuleId",
                table: "Notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TimetableExceptionId",
                table: "Notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Notifications",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "Courses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "Courses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Modules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CourseId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Modules", x => x.Id);
                    table.CheckConstraint("CK_Modules_Type", "\"Type\" IN ('Sequential', 'Compulsory', 'Optional')");
                    table.ForeignKey(
                        name: "FK_Modules_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO "Modules" ("CourseId", "Title", "Description", "Type", "Order")
                SELECT
                    c."Id",
                    c."Title" || ' - Legacy Module',
                    'Auto-created during migration from course-level assignments.',
                    'Compulsory',
                    0
                FROM "Courses" c
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM "Modules" m
                    WHERE m."CourseId" = c."Id"
                );
                """);

            migrationBuilder.Sql(
                """
                UPDATE "Assignments" a
                SET "ModuleId" = m."Id"
                FROM "Modules" m
                WHERE m."CourseId" = a."ModuleId";
                """);

            migrationBuilder.CreateTable(
                name: "Submissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AssignmentId = table.Column<int>(type: "integer", nullable: false),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    FileUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Submissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Submissions_Assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "Assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Submissions_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Assessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ModuleId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Duration = table.Column<int>(type: "integer", nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Assessments_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "Modules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ModuleId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByInstructorId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceSessions_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "Modules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AttendanceSessions_Users_CreatedByInstructorId",
                        column: x => x.CreatedByInstructorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ModuleProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    ModuleId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    FinalGrade = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleProgresses", x => x.Id);
                    table.CheckConstraint("CK_ModuleProgress_Status", "\"Status\" IN ('InProgress', 'Passed', 'Failed')");
                    table.ForeignKey(
                        name: "FK_ModuleProgresses_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "Modules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ModuleProgresses_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TimetableSlots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ModuleId = table.Column<int>(type: "integer", nullable: false),
                    InstructorId = table.Column<int>(type: "integer", nullable: false),
                    DayOfWeek = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimetableSlots", x => x.Id);
                    table.CheckConstraint("CK_TimetableSlots_DayOfWeek", "\"DayOfWeek\" IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')");
                    table.ForeignKey(
                        name: "FK_TimetableSlots_Modules_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "Modules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TimetableSlots_Users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AssignmentGrades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubmissionId = table.Column<int>(type: "integer", nullable: false),
                    InstructorId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<double>(type: "double precision", nullable: false),
                    GradedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Feedback = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssignmentGrades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssignmentGrades_Submissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalTable: "Submissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssignmentGrades_Users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_AssignmentId_StudentId",
                table: "Submissions",
                columns: new[] { "AssignmentId", "StudentId" },
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO "Submissions" ("AssignmentId", "StudentId", "FileUrl", "SubmittedAt")
                SELECT
                    g."AssignmentId",
                    g."UserId",
                    'legacy://submission/' || g."Id"::text,
                    g."SubmittedAt"
                FROM "Grades" g
                ON CONFLICT ("AssignmentId", "StudentId") DO NOTHING;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentGrades_SubmissionId",
                table: "AssignmentGrades",
                column: "SubmissionId",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO "AssignmentGrades" ("SubmissionId", "InstructorId", "Score", "GradedAt", "Feedback")
                SELECT
                    s."Id",
                    COALESCE(c."InstructorId", g."UserId"),
                    g."Score",
                    g."SubmittedAt",
                    'Migrated from legacy Grade record.'
                FROM "Grades" g
                INNER JOIN "Submissions" s
                    ON s."AssignmentId" = g."AssignmentId"
                    AND s."StudentId" = g."UserId"
                LEFT JOIN "Assignments" a
                    ON a."Id" = g."AssignmentId"
                LEFT JOIN "Modules" m
                    ON m."Id" = a."ModuleId"
                LEFT JOIN "Courses" c
                    ON c."Id" = m."CourseId"
                ON CONFLICT ("SubmissionId") DO NOTHING;
                """);

            migrationBuilder.DropTable(
                name: "Grades");

            migrationBuilder.CreateTable(
                name: "AssessmentGrades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AssessmentId = table.Column<int>(type: "integer", nullable: false),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    InstructorId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<double>(type: "double precision", nullable: false),
                    GradedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentGrades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentGrades_Assessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "Assessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssessmentGrades_Users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssessmentGrades_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AttendanceSessionId = table.Column<int>(type: "integer", nullable: false),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    IsPresent = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceRecords_AttendanceSessions_AttendanceSessionId",
                        column: x => x.AttendanceSessionId,
                        principalTable: "AttendanceSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AttendanceRecords_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TimetableExceptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TimetableSlotId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    RescheduleDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RescheduleStartTime = table.Column<TimeSpan>(type: "interval", nullable: true),
                    RescheduleEndTime = table.Column<TimeSpan>(type: "interval", nullable: true),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimetableExceptions", x => x.Id);
                    table.CheckConstraint("CK_TimetableExceptions_Status", "\"Status\" IN ('Cancelled', 'Rescheduled')");
                    table.ForeignKey(
                        name: "FK_TimetableExceptions_TimetableSlots_TimetableSlotId",
                        column: x => x.TimetableSlotId,
                        principalTable: "TimetableSlots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_AssessmentId",
                table: "Notifications",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_ModuleId",
                table: "Notifications",
                column: "ModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_TimetableExceptionId",
                table: "Notifications",
                column: "TimetableExceptionId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_Type_CreatedAt",
                table: "Notifications",
                columns: new[] { "UserId", "Type", "CreatedAt" });

            migrationBuilder.Sql(
                """
                UPDATE "Notifications" n
                SET
                    "Type" = 'General',
                    "ModuleId" = COALESCE(n."ModuleId", a."ModuleId")
                FROM "Assignments" a
                WHERE n."AssignmentId" = a."Id";

                UPDATE "Notifications"
                SET "Type" = 'General'
                WHERE "Type" IS NULL OR "Type" = '';
                """);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Notifications_Type",
                table: "Notifications",
                sql: "\"Type\" IN ('General', 'ClassCancelled', 'ClassRescheduled', 'AssignmentDeadline', 'AssessmentDate', 'AssignmentGraded', 'FinalGradeReleased')");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentGrades_AssessmentId_StudentId",
                table: "AssessmentGrades",
                columns: new[] { "AssessmentId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentGrades_InstructorId",
                table: "AssessmentGrades",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentGrades_StudentId_GradedAt",
                table: "AssessmentGrades",
                columns: new[] { "StudentId", "GradedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Assessments_ModuleId_ScheduledAt",
                table: "Assessments",
                columns: new[] { "ModuleId", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentGrades_InstructorId_GradedAt",
                table: "AssignmentGrades",
                columns: new[] { "InstructorId", "GradedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_AttendanceSessionId_StudentId",
                table: "AttendanceRecords",
                columns: new[] { "AttendanceSessionId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_StudentId",
                table: "AttendanceRecords",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceSessions_CreatedByInstructorId",
                table: "AttendanceSessions",
                column: "CreatedByInstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceSessions_ModuleId_Date",
                table: "AttendanceSessions",
                columns: new[] { "ModuleId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModuleProgresses_ModuleId",
                table: "ModuleProgresses",
                column: "ModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_ModuleProgresses_StudentId_ModuleId",
                table: "ModuleProgresses",
                columns: new[] { "StudentId", "ModuleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Modules_CourseId",
                table: "Modules",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Modules_CourseId_Order",
                table: "Modules",
                columns: new[] { "CourseId", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_StudentId",
                table: "Submissions",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_SubmittedAt",
                table: "Submissions",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TimetableExceptions_TimetableSlotId_Date",
                table: "TimetableExceptions",
                columns: new[] { "TimetableSlotId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TimetableSlots_InstructorId",
                table: "TimetableSlots",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_TimetableSlots_ModuleId_DayOfWeek_StartTime_EndTime",
                table: "TimetableSlots",
                columns: new[] { "ModuleId", "DayOfWeek", "StartTime", "EndTime" });

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Modules_ModuleId",
                table: "Assignments",
                column: "ModuleId",
                principalTable: "Modules",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Assessments_AssessmentId",
                table: "Notifications",
                column: "AssessmentId",
                principalTable: "Assessments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Modules_ModuleId",
                table: "Notifications",
                column: "ModuleId",
                principalTable: "Modules",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_TimetableExceptions_TimetableExceptionId",
                table: "Notifications",
                column: "TimetableExceptionId",
                principalTable: "TimetableExceptions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Modules_ModuleId",
                table: "Assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Assessments_AssessmentId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Modules_ModuleId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_TimetableExceptions_TimetableExceptionId",
                table: "Notifications");

            migrationBuilder.DropTable(
                name: "AssessmentGrades");

            migrationBuilder.DropTable(
                name: "AssignmentGrades");

            migrationBuilder.DropTable(
                name: "AttendanceRecords");

            migrationBuilder.DropTable(
                name: "ModuleProgresses");

            migrationBuilder.DropTable(
                name: "TimetableExceptions");

            migrationBuilder.DropTable(
                name: "Assessments");

            migrationBuilder.DropTable(
                name: "Submissions");

            migrationBuilder.DropTable(
                name: "AttendanceSessions");

            migrationBuilder.DropTable(
                name: "TimetableSlots");

            migrationBuilder.DropTable(
                name: "Modules");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_AssessmentId",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_ModuleId",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_TimetableExceptionId",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_UserId_Type_CreatedAt",
                table: "Notifications");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Notifications_Type",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "AssessmentId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "ModuleId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TimetableExceptionId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "Courses");

            migrationBuilder.RenameColumn(
                name: "ModuleId",
                table: "Assignments",
                newName: "CourseId");

            migrationBuilder.RenameIndex(
                name: "IX_Assignments_ModuleId_Deadline",
                table: "Assignments",
                newName: "IX_Assignments_CourseId_Deadline");

            migrationBuilder.CreateTable(
                name: "Grades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AssignmentId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<double>(type: "double precision", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Grades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Grades_Assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "Assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Grades_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_AssignmentId",
                table: "Notifications",
                columns: new[] { "UserId", "AssignmentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Grades_AssignmentId",
                table: "Grades",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Grades_SubmittedAt",
                table: "Grades",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Grades_UserId_AssignmentId",
                table: "Grades",
                columns: new[] { "UserId", "AssignmentId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Courses_CourseId",
                table: "Assignments",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
