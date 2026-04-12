using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollegeLMS.API.Migrations
{
    /// <inheritdoc />
    public partial class AddModuleGradeReleaseState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsReleased",
                table: "ModuleProgresses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsReleased",
                table: "ModuleProgresses");
        }
    }
}
