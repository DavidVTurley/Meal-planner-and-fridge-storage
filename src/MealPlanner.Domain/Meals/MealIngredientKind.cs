namespace MealPlanner.Domain.Meals;

public enum MealIngredientKind
{
    Known,
    Unknown,
}

public static class MealIngredientKindExtensions
{
    public static string ToApiValue(this MealIngredientKind kind) => kind switch
    {
        MealIngredientKind.Known => "known",
        MealIngredientKind.Unknown => "unknown",
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null),
    };
}
