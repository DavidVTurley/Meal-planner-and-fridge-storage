using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MealPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialInventoryFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "default_product",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    DefaultShelfLifeDays = table.Column<int>(type: "int", nullable: false),
                    AmountPerPackage = table.Column<decimal>(type: "decimal(18,3)", precision: 18, scale: 3, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    PreviousVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsCurrent = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_default_product", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "inventory_item",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    IngredientName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    RemainingAmountMetric = table.Column<decimal>(type: "decimal(18,3)", precision: 18, scale: 3, nullable: false),
                    SnapshotAmountPerPackage = table.Column<decimal>(type: "decimal(18,3)", precision: 18, scale: 3, nullable: false),
                    SnapshotUnit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LocationCanonical = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    LocationDisplay = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DateAdded = table.Column<DateOnly>(type: "date", nullable: false),
                    SellByDate = table.Column<DateOnly>(type: "date", nullable: false),
                    DefaultProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_item", x => x.Id);
                    table.ForeignKey(
                        name: "FK_inventory_item_default_product_DefaultProductId",
                        column: x => x.DefaultProductId,
                        principalTable: "default_product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_default_product_UserId_Id",
                table: "default_product",
                columns: new[] { "UserId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_default_product_UserId_Name_IsCurrent",
                table: "default_product",
                columns: new[] { "UserId", "Name", "IsCurrent" });

            migrationBuilder.CreateIndex(
                name: "IX_inventory_item_DefaultProductId",
                table: "inventory_item",
                column: "DefaultProductId");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_item_UserId_DefaultProductId",
                table: "inventory_item",
                columns: new[] { "UserId", "DefaultProductId" });

            migrationBuilder.CreateIndex(
                name: "IX_inventory_item_UserId_LocationCanonical",
                table: "inventory_item",
                columns: new[] { "UserId", "LocationCanonical" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inventory_item");

            migrationBuilder.DropTable(
                name: "default_product");
        }
    }
}
