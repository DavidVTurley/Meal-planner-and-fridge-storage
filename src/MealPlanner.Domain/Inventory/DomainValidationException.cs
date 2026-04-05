namespace MealPlanner.Domain.Inventory;

public sealed class DomainValidationException(string message) : Exception(message);
