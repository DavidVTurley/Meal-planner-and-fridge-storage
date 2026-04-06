using MealPlanner.Application.Abstractions;
using MealPlanner.Domain.Meals;
using MealPlanner.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MealPlanner.Infrastructure.Repositories;

public sealed class UnknownIngredientRepository(MealPlannerDbContext dbContext) : IUnknownIngredientRepository
{
    public Task AddAsync(UnknownIngredient unknownIngredient, CancellationToken cancellationToken)
    {
        dbContext.UnknownIngredients.Add(unknownIngredient);
        return Task.CompletedTask;
    }

    public Task<UnknownIngredient?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken)
    {
        return dbContext.UnknownIngredients.FirstOrDefaultAsync(
            x => x.Id == id && x.UserId == userId,
            cancellationToken);
    }

    public Task<UnknownIngredient?> GetActiveByNormalizedNameAsync(string userId, string normalizedName, CancellationToken cancellationToken)
    {
        return dbContext.UnknownIngredients.FirstOrDefaultAsync(
            x => x.UserId == userId && x.NormalizedName == normalizedName && x.Status == UnknownIngredientStatus.Active,
            cancellationToken);
    }

    public async Task<IReadOnlyList<UnknownIngredient>> ListActiveAsync(string userId, CancellationToken cancellationToken)
    {
        return await dbContext.UnknownIngredients
            .Where(x => x.UserId == userId && x.Status == UnknownIngredientStatus.Active)
            .OrderBy(x => x.DisplayName)
            .ToListAsync(cancellationToken);
    }
}
