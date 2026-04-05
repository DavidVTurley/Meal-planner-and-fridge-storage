namespace MealPlanner.Application.Inventory;

public sealed class NotFoundException(string message) : Exception(message);
