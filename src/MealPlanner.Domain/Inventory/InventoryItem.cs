namespace MealPlanner.Domain.Inventory;

public sealed class InventoryItem
{
    private InventoryItem() { }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string IngredientName { get; private set; } = string.Empty;
    public decimal RemainingAmountMetric { get; private set; }
    public decimal SnapshotAmountPerPackage { get; private set; }
    public MeasurementUnit SnapshotUnit { get; private set; }
    public string LocationCanonical { get; private set; } = string.Empty;
    public string LocationDisplay { get; private set; } = string.Empty;
    public DateOnly DateAdded { get; private set; }
    public DateOnly SellByDate { get; private set; }
    public Guid DefaultProductId { get; private set; }
    public string ConcurrencyToken { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static InventoryItem Create(
        string userId,
        string ingredientName,
        decimal remainingAmountMetric,
        decimal snapshotAmountPerPackage,
        MeasurementUnit snapshotUnit,
        string locationDisplay,
        DateOnly dateAdded,
        DateOnly sellByDate,
        Guid defaultProductId)
    {
        Validate(userId, ingredientName, remainingAmountMetric, snapshotAmountPerPackage, defaultProductId);

        var now = DateTimeOffset.UtcNow;

        return new InventoryItem
        {
            Id = Guid.NewGuid(),
            UserId = userId.Trim(),
            IngredientName = ingredientName.Trim(),
            RemainingAmountMetric = remainingAmountMetric,
            SnapshotAmountPerPackage = snapshotAmountPerPackage,
            SnapshotUnit = snapshotUnit,
            LocationDisplay = locationDisplay.Trim(),
            LocationCanonical = LocationNormalizer.ToCanonical(locationDisplay),
            DateAdded = dateAdded,
            SellByDate = sellByDate,
            DefaultProductId = defaultProductId,
            ConcurrencyToken = Guid.NewGuid().ToString("N"),
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
    }

    public void ManualDecrement(decimal amount)
    {
        if (amount <= 0)
        {
            throw new DomainValidationException("Decrement amount must be greater than 0.");
        }

        if (RemainingAmountMetric - amount < 0)
        {
            throw new DomainValidationException("Remaining amount cannot become negative.");
        }

        RemainingAmountMetric -= amount;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
        ConcurrencyToken = Guid.NewGuid().ToString("N");
    }

    public FreshnessStatus GetFreshnessStatus(DateOnly currentDate)
    {
        if (currentDate > SellByDate)
        {
            return FreshnessStatus.Expired;
        }

        if (currentDate >= SellByDate.AddDays(-3))
        {
            return FreshnessStatus.UseSoon;
        }

        return FreshnessStatus.Normal;
    }

    private static void Validate(string userId, string ingredientName, decimal remainingAmountMetric, decimal snapshotAmountPerPackage, Guid defaultProductId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new DomainValidationException("UserId is required.");
        }

        if (string.IsNullOrWhiteSpace(ingredientName))
        {
            throw new DomainValidationException("IngredientName is required.");
        }

        if (remainingAmountMetric < 0)
        {
            throw new DomainValidationException("RemainingAmountMetric cannot be negative.");
        }

        if (snapshotAmountPerPackage <= 0)
        {
            throw new DomainValidationException("SnapshotAmountPerPackage must be greater than 0.");
        }

        if (defaultProductId == Guid.Empty)
        {
            throw new DomainValidationException("DefaultProductId is required.");
        }
    }
}
