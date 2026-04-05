using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MealPlanner.Infrastructure.Persistence;

public sealed class MealPlannerDbContextFactory : IDesignTimeDbContextFactory<MealPlannerDbContext>
{
    public MealPlannerDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("MEALPLANNER_DB_CONNECTION")
            ?? "Server=(localdb)\\MSSQLLocalDB;Database=meal_planner;Trusted_Connection=True;TrustServerCertificate=True";

        var optionsBuilder = new DbContextOptionsBuilder<MealPlannerDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new MealPlannerDbContext(optionsBuilder.Options);
    }
}
