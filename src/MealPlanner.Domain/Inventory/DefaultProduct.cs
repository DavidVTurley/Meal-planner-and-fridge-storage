namespace MealPlanner.Domain.Inventory;

public sealed class DefaultProduct
{
    private DefaultProduct() { }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public int DefaultShelfLifeDays { get; private set; }
    public decimal AmountPerPackage { get; private set; }
    public MeasurementUnit Unit { get; private set; }
    public int Version { get; private set; }
    public Guid? PreviousVersionId { get; private set; }
    public bool IsCurrent { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static DefaultProduct Create(string userId, string name, int defaultShelfLifeDays, decimal amountPerPackage, MeasurementUnit unit)
    {
        Validate(userId, name, defaultShelfLifeDays, amountPerPackage);

        var now = DateTimeOffset.UtcNow;

        return new DefaultProduct
        {
            Id = Guid.NewGuid(),
            UserId = userId.Trim(),
            Name = name.Trim(),
            DefaultShelfLifeDays = defaultShelfLifeDays,
            AmountPerPackage = amountPerPackage,
            Unit = unit,
            Version = 1,
            PreviousVersionId = null,
            IsCurrent = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
    }

    public DefaultProduct CreateNextVersion(string name, int defaultShelfLifeDays, decimal amountPerPackage, MeasurementUnit unit)
    {
        Validate(UserId, name, defaultShelfLifeDays, amountPerPackage);

        IsCurrent = false;
        UpdatedAtUtc = DateTimeOffset.UtcNow;

        var now = DateTimeOffset.UtcNow;

        return new DefaultProduct
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Name = name.Trim(),
            DefaultShelfLifeDays = defaultShelfLifeDays,
            AmountPerPackage = amountPerPackage,
            Unit = unit,
            Version = Version + 1,
            PreviousVersionId = Id,
            IsCurrent = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
    }

    private static void Validate(string userId, string name, int defaultShelfLifeDays, decimal amountPerPackage)
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
    }
}
