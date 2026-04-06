namespace MealPlanner.Domain.Meals;

public enum UnknownIngredientStatus
{
    Active,
    Converted,
}

public static class UnknownIngredientStatusExtensions
{
    public static string ToApiValue(this UnknownIngredientStatus status) => status switch
    {
        UnknownIngredientStatus.Active => "active",
        UnknownIngredientStatus.Converted => "converted",
        _ => throw new ArgumentOutOfRangeException(nameof(status), status, null),
    };
}
