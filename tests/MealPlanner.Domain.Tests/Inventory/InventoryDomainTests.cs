using MealPlanner.Domain.Inventory;

namespace MealPlanner.Domain.Tests.Inventory;

public sealed class InventoryDomainTests
{
    [Fact]
    public void CreateNextVersion_MarksPreviousNonCurrent_AndIncrementsVersion()
    {
        var original = DefaultProduct.Create("user-1", "Pasta", 7, 1000, MeasurementUnit.Grams);

        var next = original.CreateNextVersion("Pasta", 5, 800, MeasurementUnit.Grams);

        Assert.False(original.IsCurrent);
        Assert.True(next.IsCurrent);
        Assert.Equal(2, next.Version);
        Assert.Equal(original.Id, next.PreviousVersionId);
    }

    [Fact]
    public void ManualDecrement_Throws_WhenResultWouldBeNegative()
    {
        var item = InventoryItem.Create("user-1", "Pasta", 100, 1000, MeasurementUnit.Grams, "Pantry", new DateOnly(2026, 4, 5), new DateOnly(2026, 4, 10), Guid.NewGuid());

        Assert.Throws<DomainValidationException>(() => item.ManualDecrement(120));
    }

    [Fact]
    public void Freshness_IsUseSoon_ThreeDaysBeforeSellBy()
    {
        var item = InventoryItem.Create("user-1", "Milk", 500, 1000, MeasurementUnit.Milliliters, "Fridge", new DateOnly(2026, 4, 1), new DateOnly(2026, 4, 10), Guid.NewGuid());

        var status = item.GetFreshnessStatus(new DateOnly(2026, 4, 7));

        Assert.Equal(FreshnessStatus.UseSoon, status);
    }
}
