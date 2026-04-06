using MealPlanner.Domain.Inventory;

namespace MealPlanner.Domain.Meals;

public sealed class MealIngredientLine
{
    private MealIngredientLine() { }

    public Guid Id { get; private set; }
    public Guid MealDefinitionId { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public MealIngredientKind IngredientKind { get; private set; }
    public Guid? DefaultProductId { get; private set; }
    public Guid? UnknownIngredientId { get; private set; }
    public decimal Amount { get; private set; }
    public int MeasurementTypeId { get; private set; }
    public string DisplayName { get; private set; } = string.Empty;
    public int SortOrder { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static MealIngredientLine CreateKnown(
        Guid mealDefinitionId,
        string userId,
        Guid defaultProductId,
        decimal amount,
        int measurementTypeId,
        string displayName,
        int sortOrder)
    {
        if (defaultProductId == Guid.Empty)
        {
            throw new DomainValidationException("Known ingredient line requires DefaultProductId.");
        }

        return Create(
            mealDefinitionId,
            userId,
            MealIngredientKind.Known,
            defaultProductId,
            null,
            amount,
            measurementTypeId,
            displayName,
            sortOrder);
    }

    public static MealIngredientLine CreateUnknown(
        Guid mealDefinitionId,
        string userId,
        Guid unknownIngredientId,
        decimal amount,
        int measurementTypeId,
        string displayName,
        int sortOrder)
    {
        if (unknownIngredientId == Guid.Empty)
        {
            throw new DomainValidationException("Unknown ingredient line requires UnknownIngredientId.");
        }

        return Create(
            mealDefinitionId,
            userId,
            MealIngredientKind.Unknown,
            null,
            unknownIngredientId,
            amount,
            measurementTypeId,
            displayName,
            sortOrder);
    }

    public void ConvertToKnown(Guid defaultProductId, int measurementTypeId, string displayName)
    {
        if (defaultProductId == Guid.Empty)
        {
            throw new DomainValidationException("DefaultProductId is required.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainValidationException("DisplayName is required.");
        }

        _ = MeasurementTypeMapper.ToApiValue(measurementTypeId);

        IngredientKind = MealIngredientKind.Known;
        DefaultProductId = defaultProductId;
        UnknownIngredientId = null;
        MeasurementTypeId = measurementTypeId;
        DisplayName = displayName.Trim();
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }

    private static MealIngredientLine Create(
        Guid mealDefinitionId,
        string userId,
        MealIngredientKind ingredientKind,
        Guid? defaultProductId,
        Guid? unknownIngredientId,
        decimal amount,
        int measurementTypeId,
        string displayName,
        int sortOrder)
    {
        Validate(mealDefinitionId, userId, amount, measurementTypeId, displayName, sortOrder, ingredientKind, defaultProductId, unknownIngredientId);

        var now = DateTimeOffset.UtcNow;
        return new MealIngredientLine
        {
            Id = Guid.NewGuid(),
            MealDefinitionId = mealDefinitionId,
            UserId = userId.Trim(),
            IngredientKind = ingredientKind,
            DefaultProductId = defaultProductId,
            UnknownIngredientId = unknownIngredientId,
            Amount = amount,
            MeasurementTypeId = measurementTypeId,
            DisplayName = displayName.Trim(),
            SortOrder = sortOrder,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
    }

    private static void Validate(
        Guid mealDefinitionId,
        string userId,
        decimal amount,
        int measurementTypeId,
        string displayName,
        int sortOrder,
        MealIngredientKind ingredientKind,
        Guid? defaultProductId,
        Guid? unknownIngredientId)
    {
        if (mealDefinitionId == Guid.Empty)
        {
            throw new DomainValidationException("MealDefinitionId is required.");
        }

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new DomainValidationException("UserId is required.");
        }

        if (amount <= 0)
        {
            throw new DomainValidationException("Amount must be greater than 0.");
        }

        _ = MeasurementTypeMapper.ToApiValue(measurementTypeId);

        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainValidationException("DisplayName is required.");
        }

        if (sortOrder < 0)
        {
            throw new DomainValidationException("SortOrder cannot be negative.");
        }

        var hasKnown = defaultProductId.HasValue;
        var hasUnknown = unknownIngredientId.HasValue;
        if (hasKnown == hasUnknown)
        {
            throw new DomainValidationException("Exactly one of DefaultProductId or UnknownIngredientId must be set.");
        }

        if (ingredientKind == MealIngredientKind.Known && !hasKnown)
        {
            throw new DomainValidationException("Known ingredient lines must reference a default product.");
        }

        if (ingredientKind == MealIngredientKind.Unknown && !hasUnknown)
        {
            throw new DomainValidationException("Unknown ingredient lines must reference an unknown ingredient.");
        }
    }
}
