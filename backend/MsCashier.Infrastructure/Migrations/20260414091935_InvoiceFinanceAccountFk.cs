using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MsCashier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InvoiceFinanceAccountFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FinanceAccountId",
                table: "Invoices",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_FinanceAccountId",
                table: "Invoices",
                column: "FinanceAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_TenantId_FinanceAccountId",
                table: "Invoices",
                columns: new[] { "TenantId", "FinanceAccountId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_FinanceAccounts_FinanceAccountId",
                table: "Invoices",
                column: "FinanceAccountId",
                principalTable: "FinanceAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_FinanceAccounts_FinanceAccountId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_FinanceAccountId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_TenantId_FinanceAccountId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "FinanceAccountId",
                table: "Invoices");
        }
    }
}
