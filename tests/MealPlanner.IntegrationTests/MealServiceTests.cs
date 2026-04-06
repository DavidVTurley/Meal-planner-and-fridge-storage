using MealPlanner.Application.Inventory;
using MealPlanner.Application.Meals;
using MealPlanner.Infrastructure.Persistence;
using MealPlanner.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace MealPlanner.IntegrationTests;

public sealed class MealServiceTests
{
    [Fact]
    public async Task CreateMeal_WithKnownAndUnknownLines_WorksAndTracksUnknownOverview()
    {
        await using var db = CreateDb();
        var defaultService = new DefaultProductService(new DefaultProductRepository(db), db);
        var mealService = CreateMealService(db);

        var known = await defaultService.CreateAsync(
            "user-1",
            new CreateDefaultProductRequest("Chicken", 5, 1000, "g"),
            CancellationToken.None);

        var meal = await mealService.CreateAsync(
            "user-1",
            new CreateMealRequest(
                "Chicken Soup",
                [
                    new UpsertMealIngredientLineRequest("known", known.Id, null, null, null, 500),
                    new UpsertMealIngredientLineRequest("unknown", null, null, "Homemade Stock", "ml", 300),
                ]),
            CancellationToken.None);

        Assert.Equal(2, meal.IngredientLines.Count);

        var unknowns = await mealService.ListUnknownIngredientsAsync("user-1", CancellationToken.None);
        Assert.Single(unknowns);
        Assert.Equal("homemade stock", unknowns[0].NormalizedName);
        Assert.Single(unknowns[0].MealReferences);
    }

    [Fact]
    public async Task ConvertUnknownIngredient_RelinksMealLinesToKnown()
    {
        await using var db = CreateDb();
        var defaultService = new DefaultProductService(new DefaultProductRepository(db), db);
        var mealService = CreateMealService(db);

        var known = await defaultService.CreateAsync(
            "user-1",
            new CreateDefaultProductRequest("Tomato", 7, 1000, "g"),
            CancellationToken.None);

        var meal = await mealService.CreateAsync(
            "user-1",
            new CreateMealRequest(
                "Salad",
                [
                    new UpsertMealIngredientLineRequest("unknown", null, null, "Cherry Tomato", "g", 120),
                ]),
            CancellationToken.None);

        var unknown = (await mealService.ListUnknownIngredientsAsync("user-1", CancellationToken.None)).Single();

        await mealService.ConvertUnknownIngredientAsync(
            "user-1",
            new ConvertUnknownIngredientRequest(unknown.Id, known.Id),
            CancellationToken.None);

        var updated = await mealService.GetByIdAsync("user-1", meal.Id, CancellationToken.None);
        var line = Assert.Single(updated.IngredientLines);
        Assert.Equal("known", line.IngredientKind);
        Assert.Equal(known.Id, line.DefaultProductId);
        Assert.Null(line.UnknownIngredientId);

        var unknownsAfter = await mealService.ListUnknownIngredientsAsync("user-1", CancellationToken.None);
        Assert.Empty(unknownsAfter);
    }

    [Fact]
    public async Task PieceUnit_FlowsThroughKnownAndUnknownMealLines()
    {
        await using var db = CreateDb();
        var defaultService = new DefaultProductService(new DefaultProductRepository(db), db);
        var mealService = CreateMealService(db);

        var knownPiece = await defaultService.CreateAsync(
            "user-1",
            new CreateDefaultProductRequest("Cherry Tomatoes", 5, 50, "piece"),
            CancellationToken.None);

        var meal = await mealService.CreateAsync(
            "user-1",
            new CreateMealRequest(
                "Tomato Snack",
                [
                    new UpsertMealIngredientLineRequest("known", knownPiece.Id, null, null, null, 12.5m),
                    new UpsertMealIngredientLineRequest("unknown", null, null, "Olive", "piece", 8.25m),
                ]),
            CancellationToken.None);

        Assert.Contains(meal.IngredientLines, x => x.IngredientKind == "known" && x.Unit == "piece");
        Assert.Contains(meal.IngredientLines, x => x.IngredientKind == "unknown" && x.Unit == "piece");

        var unknown = (await mealService.ListUnknownIngredientsAsync("user-1", CancellationToken.None)).Single();
        Assert.Equal("piece", unknown.Unit);
        Assert.Equal("olive", unknown.NormalizedName);
    }

    private static MealService CreateMealService(MealPlannerDbContext db)
    {
        return new MealService(
            new MealDefinitionRepository(db),
            new UnknownIngredientRepository(db),
            new DefaultProductRepository(db),
            db);
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
}
