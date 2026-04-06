using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MealPlanner.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPieceMeasurementType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF NOT EXISTS (SELECT 1 FROM measurement_type WHERE Id = 3 OR Code = 'piece')
BEGIN
    INSERT INTO measurement_type (Id, Code, Name)
    VALUES (3, 'piece', 'Piece');
END
""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
DELETE FROM measurement_type WHERE Id = 3 AND Code = 'piece';
""");
        }
    }
}
