using MealPlanner.Application.Abstractions;
using MealPlanner.Application.Inventory;
using MealPlanner.Application.Meals;
using MealPlanner.Infrastructure.Persistence;
using MealPlanner.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MealPlanner.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MealPlanner")
            ?? "Server=(localdb)\\MSSQLLocalDB;Database=meal_planner;Trusted_Connection=True;TrustServerCertificate=True";

        services.AddDbContext<MealPlannerDbContext>(options => options.UseSqlServer(connectionString));
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<MealPlannerDbContext>());
        services.AddScoped<IDefaultProductRepository, DefaultProductRepository>();
        services.AddScoped<IInventoryItemRepository, InventoryItemRepository>();
        services.AddScoped<IMealDefinitionRepository, MealDefinitionRepository>();
        services.AddScoped<IUnknownIngredientRepository, UnknownIngredientRepository>();
        services.AddScoped<DefaultProductService>();
        services.AddScoped<InventoryService>();
        services.AddScoped<MealService>();

        return services;
    }
}
