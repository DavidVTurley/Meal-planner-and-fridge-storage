using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MealPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MealsMeasurementTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int?>(
                name: "SnapshotMeasurementTypeId",
                table: "inventory_item",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int?>(
                name: "MeasurementTypeId",
                table: "default_product",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "measurement_type",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_measurement_type", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "measurement_type",
                columns: new[] { "Id", "Code", "Name" },
                values: new object[,]
                {
                    { 1, "g", "Grams" },
                    { 2, "ml", "Milliliters" }
                });

            migrationBuilder.CreateTable(
                name: "meal_definition",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_definition", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "unknown_ingredient",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    MeasurementTypeId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ConvertedDefaultProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unknown_ingredient", x => x.Id);
                    table.ForeignKey(
                        name: "FK_unknown_ingredient_default_product_ConvertedDefaultProductId",
                        column: x => x.ConvertedDefaultProductId,
                        principalTable: "default_product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_unknown_ingredient_measurement_type_MeasurementTypeId",
                        column: x => x.MeasurementTypeId,
                        principalTable: "measurement_type",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.Sql("""
UPDATE default_product
SET MeasurementTypeId =
    CASE LOWER(LTRIM(RTRIM(Unit)))
        WHEN 'g' THEN 1
        WHEN 'grams' THEN 1
        WHEN 'gram' THEN 1
        WHEN 'ml' THEN 2
        WHEN 'milliliters' THEN 2
        WHEN 'milliliter' THEN 2
        ELSE NULL
    END
""");

            migrationBuilder.Sql("""
UPDATE inventory_item
SET SnapshotMeasurementTypeId =
    CASE LOWER(LTRIM(RTRIM(SnapshotUnit)))
        WHEN 'g' THEN 1
        WHEN 'grams' THEN 1
        WHEN 'gram' THEN 1
        WHEN 'ml' THEN 2
        WHEN 'milliliters' THEN 2
        WHEN 'milliliter' THEN 2
        ELSE NULL
    END
""");

            migrationBuilder.Sql("""
IF EXISTS (SELECT 1 FROM default_product WHERE MeasurementTypeId IS NULL)
    THROW 50001, 'default_product contains unsupported Unit values for measurement_type backfill.', 1;
""");

            migrationBuilder.Sql("""
IF EXISTS (SELECT 1 FROM inventory_item WHERE SnapshotMeasurementTypeId IS NULL)
    THROW 50002, 'inventory_item contains unsupported SnapshotUnit values for measurement_type backfill.', 1;
""");

            migrationBuilder.AlterColumn<int>(
                name: "SnapshotMeasurementTypeId",
                table: "inventory_item",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "MeasurementTypeId",
                table: "default_product",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_measurement_type_Code",
                table: "measurement_type",
                column: "Code",
                unique: true);

            migrationBuilder.DropColumn(
                name: "SnapshotUnit",
                table: "inventory_item");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "default_product");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_item_SnapshotMeasurementTypeId",
                table: "inventory_item",
                column: "SnapshotMeasurementTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_default_product_MeasurementTypeId",
                table: "default_product",
                column: "MeasurementTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_default_product_measurement_type_MeasurementTypeId",
                table: "default_product",
                column: "MeasurementTypeId",
                principalTable: "measurement_type",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_inventory_item_measurement_type_SnapshotMeasurementTypeId",
                table: "inventory_item",
                column: "SnapshotMeasurementTypeId",
                principalTable: "measurement_type",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.CreateIndex(
                name: "IX_meal_definition_UserId_Name",
                table: "meal_definition",
                columns: new[] { "UserId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_unknown_ingredient_ConvertedDefaultProductId",
                table: "unknown_ingredient",
                column: "ConvertedDefaultProductId");

            migrationBuilder.CreateIndex(
                name: "IX_unknown_ingredient_MeasurementTypeId",
                table: "unknown_ingredient",
                column: "MeasurementTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_unknown_ingredient_UserId_NormalizedName",
                table: "unknown_ingredient",
                columns: new[] { "UserId", "NormalizedName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_unknown_ingredient_UserId_Status",
                table: "unknown_ingredient",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateTable(
                name: "meal_ingredient_line",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MealDefinitionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    IngredientKind = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DefaultProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UnknownIngredientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,3)", precision: 18, scale: 3, nullable: false),
                    MeasurementTypeId = table.Column<int>(type: "int", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_ingredient_line", x => x.Id);
                    table.ForeignKey(
                        name: "FK_meal_ingredient_line_default_product_DefaultProductId",
                        column: x => x.DefaultProductId,
                        principalTable: "default_product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_meal_ingredient_line_meal_definition_MealDefinitionId",
                        column: x => x.MealDefinitionId,
                        principalTable: "meal_definition",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_meal_ingredient_line_measurement_type_MeasurementTypeId",
                        column: x => x.MeasurementTypeId,
                        principalTable: "measurement_type",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_meal_ingredient_line_unknown_ingredient_UnknownIngredientId",
                        column: x => x.UnknownIngredientId,
                        principalTable: "unknown_ingredient",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_meal_ingredient_line_DefaultProductId",
                table: "meal_ingredient_line",
                column: "DefaultProductId");

            migrationBuilder.CreateIndex(
                name: "IX_meal_ingredient_line_MealDefinitionId",
                table: "meal_ingredient_line",
                column: "MealDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_meal_ingredient_line_MeasurementTypeId",
                table: "meal_ingredient_line",
                column: "MeasurementTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_meal_ingredient_line_UnknownIngredientId",
                table: "meal_ingredient_line",
                column: "UnknownIngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_meal_ingredient_line_UserId_MealDefinitionId_SortOrder",
                table: "meal_ingredient_line",
                columns: new[] { "UserId", "MealDefinitionId", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "meal_ingredient_line");

            migrationBuilder.DropTable(
                name: "meal_definition");

            migrationBuilder.DropTable(
                name: "unknown_ingredient");

            migrationBuilder.AddColumn<string>(
                name: "SnapshotUnit",
                table: "inventory_item",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "default_product",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql("""
UPDATE default_product
SET Unit = CASE MeasurementTypeId
    WHEN 1 THEN 'g'
    WHEN 2 THEN 'ml'
    ELSE NULL
END
""");

            migrationBuilder.Sql("""
UPDATE inventory_item
SET SnapshotUnit = CASE SnapshotMeasurementTypeId
    WHEN 1 THEN 'g'
    WHEN 2 THEN 'ml'
    ELSE NULL
END
""");

            migrationBuilder.DropForeignKey(
                name: "FK_default_product_measurement_type_MeasurementTypeId",
                table: "default_product");

            migrationBuilder.DropForeignKey(
                name: "FK_inventory_item_measurement_type_SnapshotMeasurementTypeId",
                table: "inventory_item");

            migrationBuilder.DropIndex(
                name: "IX_inventory_item_SnapshotMeasurementTypeId",
                table: "inventory_item");

            migrationBuilder.DropIndex(
                name: "IX_default_product_MeasurementTypeId",
                table: "default_product");

            migrationBuilder.AlterColumn<string>(
                name: "SnapshotUnit",
                table: "inventory_item",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Unit",
                table: "default_product",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "SnapshotMeasurementTypeId",
                table: "inventory_item");

            migrationBuilder.DropColumn(
                name: "MeasurementTypeId",
                table: "default_product");

            migrationBuilder.DropTable(
                name: "measurement_type");
        }
    }
}
