using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MsCashier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentGatewayAndOtp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OtpConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Provider = table.Column<byte>(type: "tinyint", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ApiKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ApiSecret = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AccountSid = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SenderId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ServiceSid = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    OtpLength = table.Column<int>(type: "int", nullable: false),
                    ExpiryMinutes = table.Column<int>(type: "int", nullable: false),
                    MaxRetries = table.Column<int>(type: "int", nullable: false),
                    CooldownSeconds = table.Column<int>(type: "int", nullable: false),
                    MessageTemplate = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LastTestedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastTestResult = table.Column<bool>(type: "bit", nullable: true),
                    AdditionalConfig = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OtpConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentGatewayConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GatewayType = table.Column<byte>(type: "tinyint", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ApiKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SecretKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MerchantId = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PublishableKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    WebhookSecret = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CallbackUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsLiveMode = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    CurrencyCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MinAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    MaxAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    AdditionalConfig = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    LastTestedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastTestResult = table.Column<bool>(type: "bit", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentGatewayConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OtpLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OtpConfigId = table.Column<int>(type: "int", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Purpose = table.Column<byte>(type: "tinyint", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Attempts = table.Column<int>(type: "int", nullable: false),
                    GatewayMessageId = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OtpLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OtpLogs_OtpConfigs_OtpConfigId",
                        column: x => x.OtpConfigId,
                        principalTable: "OtpConfigs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OnlinePayments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GatewayConfigId = table.Column<int>(type: "int", nullable: false),
                    GatewayType = table.Column<byte>(type: "tinyint", nullable: false),
                    GatewayTransactionId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    GatewayReferenceId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrencyCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    PaymentUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PaymentMethod = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerEmail = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CustomerPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    InvoiceReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    InvoiceId = table.Column<long>(type: "bigint", nullable: true),
                    GatewayResponse = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnlinePayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OnlinePayments_PaymentGatewayConfigs_GatewayConfigId",
                        column: x => x.GatewayConfigId,
                        principalTable: "PaymentGatewayConfigs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OnlinePayments_GatewayConfigId",
                table: "OnlinePayments",
                column: "GatewayConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_OnlinePayments_GatewayTransactionId",
                table: "OnlinePayments",
                column: "GatewayTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_OnlinePayments_InvoiceId",
                table: "OnlinePayments",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_OnlinePayments_TenantId",
                table: "OnlinePayments",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_OtpConfigs_TenantId",
                table: "OtpConfigs",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_OtpConfigs_TenantId_IsDefault",
                table: "OtpConfigs",
                columns: new[] { "TenantId", "IsDefault" });

            migrationBuilder.CreateIndex(
                name: "IX_OtpLogs_ExpiresAt",
                table: "OtpLogs",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_OtpLogs_OtpConfigId",
                table: "OtpLogs",
                column: "OtpConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_OtpLogs_TenantId_Phone_Purpose",
                table: "OtpLogs",
                columns: new[] { "TenantId", "Phone", "Purpose" });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentGatewayConfigs_TenantId",
                table: "PaymentGatewayConfigs",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentGatewayConfigs_TenantId_IsDefault",
                table: "PaymentGatewayConfigs",
                columns: new[] { "TenantId", "IsDefault" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OnlinePayments");

            migrationBuilder.DropTable(
                name: "OtpLogs");

            migrationBuilder.DropTable(
                name: "PaymentGatewayConfigs");

            migrationBuilder.DropTable(
                name: "OtpConfigs");
        }
    }
}
