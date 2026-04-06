using MealPlanner.Application.Abstractions;
using MealPlanner.Domain.Meals;
using MealPlanner.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MealPlanner.Infrastructure.Repositories;

public sealed class MealDefinitionRepository(MealPlannerDbContext dbContext) : IMealDefinitionRepository
{
    public Task AddAsync(MealDefinition meal, CancellationToken cancellationToken)
    {
        dbContext.MealDefinitions.Add(meal);
        return Task.CompletedTask;
    }

    public async Task<MealDefinition?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken)
    {
        return await dbContext.MealDefinitions
            .Include(x => x.IngredientLines)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
    }

    public async Task<IReadOnlyList<MealDefinition>> ListAsync(string userId, CancellationToken cancellationToken)
    {
        return await dbContext.MealDefinitions
            .Include(x => x.IngredientLines)
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<UnknownIngredientMealReference>> ListUnknownReferencesAsync(string userId, CancellationToken cancellationToken)
    {
        return await dbContext.MealIngredientLines
            .Where(x => x.UserId == userId && x.UnknownIngredientId != null)
            .Join(
                dbContext.MealDefinitions.Where(x => x.UserId == userId),
                line => line.MealDefinitionId,
                meal => meal.Id,
                (line, meal) => new UnknownIngredientMealReference(line.UnknownIngredientId!.Value, meal.Id, meal.Name))
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task ConvertUnknownLinesToKnownAsync(
        string userId,
        Guid unknownIngredientId,
        Guid defaultProductId,
        int measurementTypeId,
        string displayName,
        CancellationToken cancellationToken)
    {
        var lines = await dbContext.MealIngredientLines
            .Where(x => x.UserId == userId && x.UnknownIngredientId == unknownIngredientId)
            .ToListAsync(cancellationToken);

        foreach (var line in lines)
        {
            line.ConvertToKnown(defaultProductId, measurementTypeId, displayName);
        }
    }
}
