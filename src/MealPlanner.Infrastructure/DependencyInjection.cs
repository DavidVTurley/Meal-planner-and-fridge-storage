using MealPlanner.Application.Abstractions;
using MealPlanner.Application.Inventory;
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
            ?? "Host=localhost;Port=5432;Database=meal_planner;Username=postgres;Password=postgres";

        services.AddDbContext<MealPlannerDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<MealPlannerDbContext>());
        services.AddScoped<IDefaultProductRepository, DefaultProductRepository>();
        services.AddScoped<IInventoryItemRepository, InventoryItemRepository>();
        services.AddScoped<DefaultProductService>();
        services.AddScoped<InventoryService>();

        return services;
    }
}
