using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MsCashier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class JournalSourceIdempotency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JournalEntries_TenantId_SourceType_SourceId",
                table: "JournalEntries");

            migrationBuilder.CreateIndex(
                name: "UX_JournalEntries_Source_Active",
                table: "JournalEntries",
                columns: new[] { "TenantId", "SourceType", "SourceId" },
                unique: true,
                filter: "[SourceType] IS NOT NULL AND [SourceId] IS NOT NULL AND [Status] <> 3");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_JournalEntries_Source_Active",
                table: "JournalEntries");

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntries_TenantId_SourceType_SourceId",
                table: "JournalEntries",
                columns: new[] { "TenantId", "SourceType", "SourceId" });
        }
    }
}
