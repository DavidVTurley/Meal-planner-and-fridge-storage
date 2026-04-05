using MealPlanner.Application.Abstractions;
using MealPlanner.Domain.Inventory;
using MealPlanner.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MealPlanner.Infrastructure.Repositories;

public sealed class DefaultProductRepository(MealPlannerDbContext dbContext) : IDefaultProductRepository
{
    public Task AddAsync(DefaultProduct product, CancellationToken cancellationToken)
    {
        dbContext.DefaultProducts.Add(product);
        return Task.CompletedTask;
    }

    public Task<DefaultProduct?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken)
    {
        return dbContext.DefaultProducts.FirstOrDefaultAsync(
            x => x.Id == id && x.UserId == userId,
            cancellationToken);
    }

    public async Task<IReadOnlyList<DefaultProduct>> ListCurrentAsync(string userId, CancellationToken cancellationToken)
    {
        return await dbContext.DefaultProducts
            .Where(x => x.UserId == userId && x.IsCurrent)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }
}
