using MealPlanner.Application.Inventory;
using MealPlanner.Domain.Inventory;
using MealPlanner.Infrastructure.Persistence;
using MealPlanner.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace MealPlanner.IntegrationTests;

public sealed class InventoryServiceTests
{
    [Fact]
    public async Task CreateInventory_AutoFillsSellByFromDefaultShelfLife()
    {
        await using var db = CreateDb();
        var defaultService = new DefaultProductService(new DefaultProductRepository(db), db);
        var inventoryService = new InventoryService(new InventoryItemRepository(db), new DefaultProductRepository(db), db);

        var createdDefault = await defaultService.CreateAsync(
            "user-1",
            new CreateDefaultProductRequest("Pasta", 10, 1000, "g"),
            CancellationToken.None);

        var createdItem = await inventoryService.CreateAsync(
            "user-1",
            new CreateInventoryItemRequest("Pasta", 1000, "Pantry", new DateOnly(2026, 4, 5), null, createdDefault.Id),
            CancellationToken.None);

        Assert.Equal(new DateOnly(2026, 4, 15), createdItem.SellByDate);
    }

    [Fact]
    public async Task ManualDecrement_ThrowsConflict_WhenEtagIsStale()
    {
        await using var db = CreateDb();
        var defaultService = new DefaultProductService(new DefaultProductRepository(db), db);
        var inventoryService = new InventoryService(new InventoryItemRepository(db), new DefaultProductRepository(db), db);

        var createdDefault = await defaultService.CreateAsync(
            "user-1",
            new CreateDefaultProductRequest("Milk", 7, 1000, "ml"),
            CancellationToken.None);

        var createdItem = await inventoryService.CreateAsync(
            "user-1",
            new CreateInventoryItemRequest("Milk", 1000, "Fridge", new DateOnly(2026, 4, 5), null, createdDefault.Id),
            CancellationToken.None);

        await inventoryService.ManualDecrementAsync(
            "user-1",
            createdItem.Id,
            $"\"{createdItem.ETag}\"",
            new ManualDecrementRequest(100),
            CancellationToken.None);

        await Assert.ThrowsAsync<ConcurrencyConflictException>(() =>
            inventoryService.ManualDecrementAsync(
                "user-1",
                createdItem.Id,
                $"\"{createdItem.ETag}\"",
                new ManualDecrementRequest(50),
                CancellationToken.None));
    }

    private static MealPlannerDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<MealPlannerDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        var db = new MealPlannerDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    [Fact]
    public async Task CreateDefaultAndInventory_WithPieceUnit_Works()
    {
        await using var db = CreateDb();
        var defaultService = new DefaultProductService(new DefaultProductRepository(db), db);
        var inventoryService = new InventoryService(new InventoryItemRepository(db), new DefaultProductRepository(db), db);

        var createdDefault = await defaultService.CreateAsync(
            "user-1",
            new CreateDefaultProductRequest("Cherry Tomatoes", 5, 50, "piece"),
            CancellationToken.None);

        var createdItem = await inventoryService.CreateAsync(
            "user-1",
            new CreateInventoryItemRequest("Cherry Tomatoes", 49.5m, "Fridge", new DateOnly(2026, 4, 6), null, createdDefault.Id),
            CancellationToken.None);

        Assert.Equal("piece", createdDefault.Unit);
        Assert.Equal("piece", createdItem.SnapshotUnit);
        Assert.Equal(49.5m, createdItem.RemainingAmountMetric);
    }
}
