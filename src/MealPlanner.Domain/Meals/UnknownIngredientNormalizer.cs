namespace MealPlanner.Domain.Meals;

public static class UnknownIngredientNormalizer
{
    public static string Normalize(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            return string.Empty;
        }

        return string.Join(' ', displayName.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }
}
