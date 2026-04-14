using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MsCashier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PostingFailureAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PostingFailures",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SourceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SourceId = table.Column<long>(type: "bigint", nullable: false),
                    Operation = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    StackTrace = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    LastRetryAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsResolved = table.Column<bool>(type: "bit", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostingFailures", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PostingFailures_Admin",
                table: "PostingFailures",
                columns: new[] { "TenantId", "IsResolved", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PostingFailures_Source",
                table: "PostingFailures",
                columns: new[] { "TenantId", "SourceType", "SourceId", "IsResolved" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PostingFailures");
        }
    }
}
