namespace MealPlanner.Domain.Inventory;

public sealed class DefaultProduct
{
    private DefaultProduct() { }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public int DefaultShelfLifeDays { get; private set; }
    public decimal AmountPerPackage { get; private set; }
    public int MeasurementTypeId { get; private set; }
    public string? DefaultLocationCanonical { get; private set; }
    public string? DefaultLocationDisplay { get; private set; }
    public int Version { get; private set; }
    public Guid? PreviousVersionId { get; private set; }
    public bool IsCurrent { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static DefaultProduct Create(
        string userId,
        string name,
        int defaultShelfLifeDays,
        decimal amountPerPackage,
        int measurementTypeId,
        string? defaultLocation)
    {
        Validate(userId, name, defaultShelfLifeDays, amountPerPackage, measurementTypeId, defaultLocation);

        var now = DateTimeOffset.UtcNow;
        var normalizedLocation = NormalizeLocation(defaultLocation);

        return new DefaultProduct
        {
            Id = Guid.NewGuid(),
            UserId = userId.Trim(),
            Name = name.Trim(),
            DefaultShelfLifeDays = defaultShelfLifeDays,
            AmountPerPackage = amountPerPackage,
            MeasurementTypeId = measurementTypeId,
            DefaultLocationCanonical = normalizedLocation.canonical,
            DefaultLocationDisplay = normalizedLocation.display,
            Version = 1,
            PreviousVersionId = null,
            IsCurrent = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
    }

    public DefaultProduct CreateNextVersion(
        string name,
        int defaultShelfLifeDays,
        decimal amountPerPackage,
        int measurementTypeId,
        string? defaultLocation)
    {
        Validate(UserId, name, defaultShelfLifeDays, amountPerPackage, measurementTypeId, defaultLocation);

        IsCurrent = false;
        UpdatedAtUtc = DateTimeOffset.UtcNow;

        var now = DateTimeOffset.UtcNow;
        var normalizedLocation = NormalizeLocation(defaultLocation);

        return new DefaultProduct
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Name = name.Trim(),
            DefaultShelfLifeDays = defaultShelfLifeDays,
            AmountPerPackage = amountPerPackage,
            MeasurementTypeId = measurementTypeId,
            DefaultLocationCanonical = normalizedLocation.canonical,
            DefaultLocationDisplay = normalizedLocation.display,
            Version = Version + 1,
            PreviousVersionId = Id,
            IsCurrent = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
    }

    private static void Validate(
        string userId,
        string name,
        int defaultShelfLifeDays,
        decimal amountPerPackage,
        int measurementTypeId,
        string? defaultLocation)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new DomainValidationException("UserId is required.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainValidationException("Name is required.");
        }

        if (defaultShelfLifeDays <= 0)
        {
            throw new DomainValidationException("DefaultShelfLifeDays must be greater than 0.");
        }

        if (amountPerPackage <= 0)
        {
            throw new DomainValidationException("AmountPerPackage must be greater than 0.");
        }

        if (!string.IsNullOrWhiteSpace(defaultLocation) && defaultLocation.Trim().Length > 128)
        {
            throw new DomainValidationException("DefaultLocation must be 128 characters or fewer.");
        }

        _ = MeasurementTypeMapper.ToApiValue(measurementTypeId);
    }

    private static (string? canonical, string? display) NormalizeLocation(string? defaultLocation)
    {
        if (string.IsNullOrWhiteSpace(defaultLocation))
        {
            return (null, null);
        }

        var display = defaultLocation.Trim();
        var canonical = LocationNormalizer.ToCanonical(display);
        return (canonical, display);
    }
}
