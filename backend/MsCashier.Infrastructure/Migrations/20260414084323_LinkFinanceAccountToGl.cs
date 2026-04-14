using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MsCashier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LinkFinanceAccountToGl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccountNumber",
                table: "FinanceAccounts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "FinanceAccounts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ChartOfAccountId",
                table: "FinanceAccounts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Iban",
                table: "FinanceAccounts",
                type: "nvarchar(34)",
                maxLength: 34,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPrimary",
                table: "FinanceAccounts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_FinanceAccounts_ChartOfAccountId",
                table: "FinanceAccounts",
                column: "ChartOfAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceAccounts_TenantId_ChartOfAccountId",
                table: "FinanceAccounts",
                columns: new[] { "TenantId", "ChartOfAccountId" });

            migrationBuilder.AddForeignKey(
                name: "FK_FinanceAccounts_ChartOfAccounts_ChartOfAccountId",
                table: "FinanceAccounts",
                column: "ChartOfAccountId",
                principalTable: "ChartOfAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FinanceAccounts_ChartOfAccounts_ChartOfAccountId",
                table: "FinanceAccounts");

            migrationBuilder.DropIndex(
                name: "IX_FinanceAccounts_ChartOfAccountId",
                table: "FinanceAccounts");

            migrationBuilder.DropIndex(
                name: "IX_FinanceAccounts_TenantId_ChartOfAccountId",
                table: "FinanceAccounts");

            migrationBuilder.DropColumn(
                name: "AccountNumber",
                table: "FinanceAccounts");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "FinanceAccounts");

            migrationBuilder.DropColumn(
                name: "ChartOfAccountId",
                table: "FinanceAccounts");

            migrationBuilder.DropColumn(
                name: "Iban",
                table: "FinanceAccounts");

            migrationBuilder.DropColumn(
                name: "IsPrimary",
                table: "FinanceAccounts");
        }
    }
}
