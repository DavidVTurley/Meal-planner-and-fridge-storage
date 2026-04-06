namespace MealPlanner.Domain.Inventory;

public sealed class MeasurementType
{
    private MeasurementType() { }

    public int Id { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
}

public static class MeasurementTypeIds
{
    public const int Grams = 1;
    public const int Milliliters = 2;
    public const int Piece = 3;
}

public static class MeasurementTypeCodes
{
    public const string Grams = "g";
    public const string Milliliters = "ml";
    public const string Piece = "piece";
}

public static class MeasurementTypeMapper
{
    public static string ToApiValue(int measurementTypeId) => measurementTypeId switch
    {
        MeasurementTypeIds.Grams => MeasurementTypeCodes.Grams,
        MeasurementTypeIds.Milliliters => MeasurementTypeCodes.Milliliters,
        MeasurementTypeIds.Piece => MeasurementTypeCodes.Piece,
        _ => throw new DomainValidationException("Measurement type is not supported."),
    };

    public static int ParseId(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            MeasurementTypeCodes.Grams => MeasurementTypeIds.Grams,
            MeasurementTypeCodes.Milliliters => MeasurementTypeIds.Milliliters,
            MeasurementTypeCodes.Piece => MeasurementTypeIds.Piece,
            _ => throw new DomainValidationException("Unit must be 'g', 'ml', or 'piece'."),
        };
    }
}
