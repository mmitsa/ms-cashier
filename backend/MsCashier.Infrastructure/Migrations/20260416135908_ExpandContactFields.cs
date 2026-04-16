using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MsCashier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpandContactFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankAccountNumber",
                table: "Contacts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "Contacts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CommercialRegister",
                table: "Contacts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreditPeriodDays",
                table: "Contacts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Iban",
                table: "Contacts",
                type: "nvarchar(34)",
                maxLength: 34,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCompany",
                table: "Contacts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "NationalId",
                table: "Contacts",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Contacts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectName",
                table: "Contacts",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BankAccountNumber",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "CommercialRegister",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "CreditPeriodDays",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "Iban",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "IsCompany",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "NationalId",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "ProjectName",
                table: "Contacts");
        }
    }
}
