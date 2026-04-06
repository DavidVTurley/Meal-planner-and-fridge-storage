using MealPlanner.Domain.Meals;

namespace MealPlanner.Application.Abstractions;

public interface IMealDefinitionRepository
{
    Task AddAsync(MealDefinition meal, CancellationToken cancellationToken);
    Task<MealDefinition?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<MealDefinition>> ListAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<UnknownIngredientMealReference>> ListUnknownReferencesAsync(string userId, CancellationToken cancellationToken);
    Task ConvertUnknownLinesToKnownAsync(
        string userId,
        Guid unknownIngredientId,
        Guid defaultProductId,
        int measurementTypeId,
        string displayName,
        CancellationToken cancellationToken);
}

public sealed record UnknownIngredientMealReference(Guid UnknownIngredientId, Guid MealId, string MealName);
