namespace MealPlanner.Domain.Inventory;

public enum MeasurementUnit
{
    Grams,
    Milliliters,
}

public static class MeasurementUnitExtensions
{
    public static string ToApiValue(this MeasurementUnit unit) => unit switch
    {
        MeasurementUnit.Grams => "g",
        MeasurementUnit.Milliliters => "ml",
        _ => throw new ArgumentOutOfRangeException(nameof(unit), unit, null),
    };

    public static MeasurementUnit Parse(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "g" => MeasurementUnit.Grams,
            "ml" => MeasurementUnit.Milliliters,
            _ => throw new DomainValidationException("Unit must be 'g' or 'ml'."),
        };
    }
}
