using MealPlanner.Domain.Inventory;

namespace MealPlanner.Domain.Meals;

public sealed class MealDefinition
{
    private MealDefinition() { }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public List<MealIngredientLine> IngredientLines { get; private set; } = [];
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static MealDefinition Create(string userId, string name, IReadOnlyList<MealIngredientLine> ingredientLines, Guid? id = null)
    {
        Validate(userId, name, ingredientLines);

        var now = DateTimeOffset.UtcNow;
        var meal = new MealDefinition
        {
            Id = id ?? Guid.NewGuid(),
            UserId = userId.Trim(),
            Name = name.Trim(),
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        meal.IngredientLines.AddRange(ingredientLines);
        return meal;
    }

    public void Replace(string name, IReadOnlyList<MealIngredientLine> ingredientLines)
    {
        Validate(UserId, name, ingredientLines);

        Name = name.Trim();
        IngredientLines.Clear();
        IngredientLines.AddRange(ingredientLines);
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }

    private static void Validate(string userId, string name, IReadOnlyList<MealIngredientLine> ingredientLines)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new DomainValidationException("UserId is required.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainValidationException("Meal name is required.");
        }

        if (ingredientLines.Count == 0)
        {
            throw new DomainValidationException("Meal must contain at least one ingredient line.");
        }
    }
}
