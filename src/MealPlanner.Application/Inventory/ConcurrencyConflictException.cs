namespace MealPlanner.Application.Inventory;

public sealed class ConcurrencyConflictException(string message) : Exception(message);
