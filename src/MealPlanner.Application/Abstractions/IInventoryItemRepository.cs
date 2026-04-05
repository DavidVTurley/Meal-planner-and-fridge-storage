using MealPlanner.Domain.Inventory;

namespace MealPlanner.Application.Abstractions;

public interface IInventoryItemRepository
{
    Task AddAsync(InventoryItem item, CancellationToken cancellationToken);
    Task<InventoryItem?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<InventoryItem>> ListAsync(string userId, string? locationCanonical, string? search, CancellationToken cancellationToken);
}
