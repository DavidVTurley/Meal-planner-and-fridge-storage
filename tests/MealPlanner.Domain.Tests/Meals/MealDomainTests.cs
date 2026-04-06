using MealPlanner.Domain.Inventory;
using MealPlanner.Domain.Meals;

namespace MealPlanner.Domain.Tests.Meals;

public sealed class MealDomainTests
{
    [Fact]
    public void IngredientLine_Throws_WhenAmountIsNotPositive()
    {
        Assert.Throws<DomainValidationException>(() =>
            MealIngredientLine.CreateKnown(
                Guid.NewGuid(),
                "user-1",
                Guid.NewGuid(),
                0,
                MeasurementTypeIds.Grams,
                "Flour",
                0));
    }

    [Fact]
    public void IngredientLine_Throws_WhenMeasurementTypeIsInvalid()
    {
        Assert.Throws<DomainValidationException>(() =>
            MealIngredientLine.CreateUnknown(
                Guid.NewGuid(),
                "user-1",
                Guid.NewGuid(),
                120,
                999,
                "Water",
                0));
    }

    [Fact]
    public void UnknownIngredient_MarkConverted_ChangesStatus()
    {
        var unknown = UnknownIngredient.Create("user-1", "Cherry tomato", MeasurementTypeIds.Grams);

        unknown.MarkConverted(Guid.NewGuid());

        Assert.Equal(UnknownIngredientStatus.Converted, unknown.Status);
        Assert.NotNull(unknown.ConvertedDefaultProductId);
    }
}
