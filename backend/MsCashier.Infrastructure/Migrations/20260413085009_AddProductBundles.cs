using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MsCashier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductBundles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte>(
                name: "BundleDiscountType",
                table: "Products",
                type: "tinyint",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BundleDiscountValue",
                table: "Products",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "BundleHasOwnStock",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<byte>(
                name: "BundlePricingMode",
                table: "Products",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<DateTime>(
                name: "BundleValidFrom",
                table: "Products",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BundleValidTo",
                table: "Products",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasVariants",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsBundle",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<long>(
                name: "BundleParentId",
                table: "InvoiceItems",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProductVariantId",
                table: "InvoiceItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VariantDescription",
                table: "InvoiceItems",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProductVariantId",
                table: "Inventories",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BundleItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    ComponentId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BundleItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BundleItems_Products_ComponentId",
                        column: x => x.ComponentId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BundleItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyPrograms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PointsPerCurrency = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RedemptionValue = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    MinRedemptionPoints = table.Column<int>(type: "int", nullable: false),
                    PointsExpireDays = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyPrograms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductVariantOptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductVariantOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductVariantOptions_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductVariants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Sku = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Barcode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    VariantCombination = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CostPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RetailPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    HalfWholesalePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WholesalePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductVariants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductVariants_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RfidScanSessions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    TotalTagsScanned = table.Column<int>(type: "int", nullable: false),
                    MatchedItems = table.Column<int>(type: "int", nullable: false),
                    UnmatchedTags = table.Column<int>(type: "int", nullable: false),
                    MissingItems = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RfidScanSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RfidScanSessions_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WarehouseQrCodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    QrCodeData = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    QrType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    LocationCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WarehouseQrCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WarehouseQrCodes_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomerLoyalties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContactId = table.Column<int>(type: "int", nullable: false),
                    LoyaltyProgramId = table.Column<int>(type: "int", nullable: false),
                    CurrentPoints = table.Column<int>(type: "int", nullable: false),
                    TotalEarnedPoints = table.Column<int>(type: "int", nullable: false),
                    TotalRedeemedPoints = table.Column<int>(type: "int", nullable: false),
                    LoyaltyCardBarcode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EnrolledAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerLoyalties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerLoyalties_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerLoyalties_LoyaltyPrograms_LoyaltyProgramId",
                        column: x => x.LoyaltyProgramId,
                        principalTable: "LoyaltyPrograms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductVariantValues",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VariantOptionId = table.Column<int>(type: "int", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductVariantValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductVariantValues_ProductVariantOptions_VariantOptionId",
                        column: x => x.VariantOptionId,
                        principalTable: "ProductVariantOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductRfidTags",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    ProductVariantId = table.Column<int>(type: "int", nullable: true),
                    RfidTagId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TagType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: true),
                    ShelfLocation = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    TaggedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastScannedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductRfidTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductRfidTags_ProductVariants_ProductVariantId",
                        column: x => x.ProductVariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProductRfidTags_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductRfidTags_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RfidScanResults",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ScanSessionId = table.Column<long>(type: "bigint", nullable: false),
                    RfidTagId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: true),
                    ScannedLocation = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ExpectedLocation = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ResultType = table.Column<byte>(type: "tinyint", nullable: false),
                    ScannedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RfidScanResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RfidScanResults_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RfidScanResults_RfidScanSessions_ScanSessionId",
                        column: x => x.ScanSessionId,
                        principalTable: "RfidScanSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyTransactions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerLoyaltyId = table.Column<int>(type: "int", nullable: false),
                    InvoiceId = table.Column<long>(type: "bigint", nullable: true),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoyaltyTransactions_CustomerLoyalties_CustomerLoyaltyId",
                        column: x => x.CustomerLoyaltyId,
                        principalTable: "CustomerLoyalties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LoyaltyTransactions_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsBundle",
                table: "Products",
                column: "IsBundle");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceItems_BundleParentId",
                table: "InvoiceItems",
                column: "BundleParentId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceItems_ProductVariantId",
                table: "InvoiceItems",
                column: "ProductVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_Inventories_ProductVariantId",
                table: "Inventories",
                column: "ProductVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_BundleItems_ComponentId",
                table: "BundleItems",
                column: "ComponentId");

            migrationBuilder.CreateIndex(
                name: "IX_BundleItems_ProductId",
                table: "BundleItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_BundleItems_TenantId_ProductId_ComponentId",
                table: "BundleItems",
                columns: new[] { "TenantId", "ProductId", "ComponentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerLoyalties_ContactId",
                table: "CustomerLoyalties",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerLoyalties_LoyaltyProgramId",
                table: "CustomerLoyalties",
                column: "LoyaltyProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyTransactions_CustomerLoyaltyId",
                table: "LoyaltyTransactions",
                column: "CustomerLoyaltyId");

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyTransactions_InvoiceId",
                table: "LoyaltyTransactions",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductRfidTags_ProductId",
                table: "ProductRfidTags",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductRfidTags_ProductVariantId",
                table: "ProductRfidTags",
                column: "ProductVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductRfidTags_WarehouseId",
                table: "ProductRfidTags",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariantOptions_ProductId",
                table: "ProductVariantOptions",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_ProductId",
                table: "ProductVariants",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariantValues_VariantOptionId",
                table: "ProductVariantValues",
                column: "VariantOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_RfidScanResults_ProductId",
                table: "RfidScanResults",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_RfidScanResults_ScanSessionId",
                table: "RfidScanResults",
                column: "ScanSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_RfidScanSessions_WarehouseId",
                table: "RfidScanSessions",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseQrCodes_WarehouseId",
                table: "WarehouseQrCodes",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Inventories_ProductVariants_ProductVariantId",
                table: "Inventories",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceItems_InvoiceItems_BundleParentId",
                table: "InvoiceItems",
                column: "BundleParentId",
                principalTable: "InvoiceItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceItems_ProductVariants_ProductVariantId",
                table: "InvoiceItems",
                column: "ProductVariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Inventories_ProductVariants_ProductVariantId",
                table: "Inventories");

            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceItems_InvoiceItems_BundleParentId",
                table: "InvoiceItems");

            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceItems_ProductVariants_ProductVariantId",
                table: "InvoiceItems");

            migrationBuilder.DropTable(
                name: "BundleItems");

            migrationBuilder.DropTable(
                name: "LoyaltyTransactions");

            migrationBuilder.DropTable(
                name: "ProductRfidTags");

            migrationBuilder.DropTable(
                name: "ProductVariantValues");

            migrationBuilder.DropTable(
                name: "RfidScanResults");

            migrationBuilder.DropTable(
                name: "WarehouseQrCodes");

            migrationBuilder.DropTable(
                name: "CustomerLoyalties");

            migrationBuilder.DropTable(
                name: "ProductVariants");

            migrationBuilder.DropTable(
                name: "ProductVariantOptions");

            migrationBuilder.DropTable(
                name: "RfidScanSessions");

            migrationBuilder.DropTable(
                name: "LoyaltyPrograms");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsBundle",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_InvoiceItems_BundleParentId",
                table: "InvoiceItems");

            migrationBuilder.DropIndex(
                name: "IX_InvoiceItems_ProductVariantId",
                table: "InvoiceItems");

            migrationBuilder.DropIndex(
                name: "IX_Inventories_ProductVariantId",
                table: "Inventories");

            migrationBuilder.DropColumn(
                name: "BundleDiscountType",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BundleDiscountValue",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BundleHasOwnStock",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BundlePricingMode",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BundleValidFrom",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BundleValidTo",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "HasVariants",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsBundle",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BundleParentId",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "ProductVariantId",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "VariantDescription",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "ProductVariantId",
                table: "Inventories");
        }
    }
}
