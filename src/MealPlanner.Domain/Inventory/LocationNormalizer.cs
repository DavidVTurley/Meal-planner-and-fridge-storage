namespace MealPlanner.Domain.Inventory;

public static class LocationNormalizer
{
    public static string ToCanonical(string location)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            throw new DomainValidationException("Location is required.");
        }

        return string.Join(' ', location.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }
}
