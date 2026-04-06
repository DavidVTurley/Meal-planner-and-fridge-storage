using MealPlanner.Domain.Inventory;

namespace MealPlanner.Domain.Meals;

public sealed class UnknownIngredient
{
    private UnknownIngredient() { }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string NormalizedName { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public int MeasurementTypeId { get; private set; }
    public UnknownIngredientStatus Status { get; private set; }
    public Guid? ConvertedDefaultProductId { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static UnknownIngredient Create(string userId, string displayName, int measurementTypeId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new DomainValidationException("UserId is required.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainValidationException("Unknown ingredient display name is required.");
        }

        _ = MeasurementTypeMapper.ToApiValue(measurementTypeId);

        var now = DateTimeOffset.UtcNow;
        return new UnknownIngredient
        {
            Id = Guid.NewGuid(),
            UserId = userId.Trim(),
            DisplayName = displayName.Trim(),
            NormalizedName = UnknownIngredientNormalizer.Normalize(displayName),
            MeasurementTypeId = measurementTypeId,
            Status = UnknownIngredientStatus.Active,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
    }

    public void MarkConverted(Guid defaultProductId)
    {
        if (defaultProductId == Guid.Empty)
        {
            throw new DomainValidationException("DefaultProductId is required.");
        }

        if (Status == UnknownIngredientStatus.Converted)
        {
            return;
        }

        Status = UnknownIngredientStatus.Converted;
        ConvertedDefaultProductId = defaultProductId;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }
}
