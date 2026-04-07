using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MealPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [Migration("20260407142000_AddDefaultProductDefaultLocation")]
    public partial class AddDefaultProductDefaultLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DefaultLocationCanonical",
                table: "default_product",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultLocationDisplay",
                table: "default_product",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultLocationCanonical",
                table: "default_product");

            migrationBuilder.DropColumn(
                name: "DefaultLocationDisplay",
                table: "default_product");
        }
    }
}
