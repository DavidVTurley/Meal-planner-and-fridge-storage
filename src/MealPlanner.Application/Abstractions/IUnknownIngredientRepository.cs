using MealPlanner.Domain.Meals;

namespace MealPlanner.Application.Abstractions;

public interface IUnknownIngredientRepository
{
    Task AddAsync(UnknownIngredient unknownIngredient, CancellationToken cancellationToken);
    Task<UnknownIngredient?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken);
    Task<UnknownIngredient?> GetActiveByNormalizedNameAsync(string userId, string normalizedName, CancellationToken cancellationToken);
    Task<IReadOnlyList<UnknownIngredient>> ListActiveAsync(string userId, CancellationToken cancellationToken);
}
