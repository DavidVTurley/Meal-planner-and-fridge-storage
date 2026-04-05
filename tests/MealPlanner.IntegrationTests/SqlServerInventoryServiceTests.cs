using MealPlanner.Application.Inventory;
using MealPlanner.Infrastructure.Persistence;
using MealPlanner.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace MealPlanner.IntegrationTests;

public sealed class SqlServerInventoryServiceTests
{
    private static readonly string ConnectionString = Environment.GetEnvironmentVariable("TEST_SQLSERVER_CONNECTION")
        ?? Environment.GetEnvironmentVariable("MEALPLANNER_DB_CONNECTION")
        ?? "Server=localhost;Database=meal_planner;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True";

    [Fact]
    public async Task CreateInventory_PersistsToSqlServer_WithAutoSellBy()
    {
        await using var db = CreateDb();
        await db.Database.MigrateAsync();

        var userId = $"itest-sql-{Guid.NewGuid():N}";
        var defaultService = new DefaultProductService(new DefaultProductRepository(db), db);
        var inventoryService = new InventoryService(new InventoryItemRepository(db), new DefaultProductRepository(db), db);

        var createdDefault = await defaultService.CreateAsync(
            userId,
            new CreateDefaultProductRequest("Rice", 5, 1000, "g"),
            CancellationToken.None);

        var createdItem = await inventoryService.CreateAsync(
            userId,
            new CreateInventoryItemRequest("Rice", 1000, "Pantry", new DateOnly(2026, 4, 5), null, createdDefault.Id),
            CancellationToken.None);

        var stored = await db.InventoryItems.SingleAsync(x => x.Id == createdItem.Id);

        Assert.Equal(new DateOnly(2026, 4, 10), stored.SellByDate);
        Assert.Equal("pantry", stored.LocationCanonical);
        Assert.Equal("Pantry", stored.LocationDisplay);
    }

    [Fact]
    public async Task ManualDecrement_RefreshesEtag_InSqlServer()
    {
        await using var db = CreateDb();
        await db.Database.MigrateAsync();

        var userId = $"itest-sql-{Guid.NewGuid():N}";
        var defaultService = new DefaultProductService(new DefaultProductRepository(db), db);
        var inventoryService = new InventoryService(new InventoryItemRepository(db), new DefaultProductRepository(db), db);

        var createdDefault = await defaultService.CreateAsync(
            userId,
            new CreateDefaultProductRequest("Milk", 7, 1000, "ml"),
            CancellationToken.None);

        var createdItem = await inventoryService.CreateAsync(
            userId,
            new CreateInventoryItemRequest("Milk", 1000, "Fridge", new DateOnly(2026, 4, 5), null, createdDefault.Id),
            CancellationToken.None);

        var updated = await inventoryService.ManualDecrementAsync(
            userId,
            createdItem.Id,
            $"\"{createdItem.ETag}\"",
            new ManualDecrementRequest(250),
            CancellationToken.None);

        Assert.NotEqual(createdItem.ETag, updated.ETag);
        Assert.Equal(750, updated.RemainingAmountMetric);
    }

    private static MealPlannerDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<MealPlannerDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;

        return new MealPlannerDbContext(options);
    }
}
