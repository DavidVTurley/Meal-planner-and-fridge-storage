using MealPlanner.Application.Abstractions;
using MealPlanner.Domain.Inventory;
using MealPlanner.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MealPlanner.Infrastructure.Repositories;

public sealed class InventoryItemRepository(MealPlannerDbContext dbContext) : IInventoryItemRepository
{
    public Task AddAsync(InventoryItem item, CancellationToken cancellationToken)
    {
        dbContext.InventoryItems.Add(item);
        return Task.CompletedTask;
    }

    public Task<InventoryItem?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken)
    {
        return dbContext.InventoryItems.FirstOrDefaultAsync(
            x => x.Id == id && x.UserId == userId,
            cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryItem>> ListAsync(string userId, string? locationCanonical, string? search, CancellationToken cancellationToken)
    {
        var query = dbContext.InventoryItems.Where(x => x.UserId == userId);

        if (!string.IsNullOrWhiteSpace(locationCanonical))
        {
            query = query.Where(x => x.LocationCanonical == locationCanonical);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLowerInvariant();
            query = query.Where(x => x.IngredientName.ToLower().Contains(normalized));
        }

        return await query
            .OrderBy(x => x.SellByDate)
            .ThenBy(x => x.IngredientName)
            .ToListAsync(cancellationToken);
    }
}
