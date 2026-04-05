using MealPlanner.Domain.Inventory;

namespace MealPlanner.Application.Abstractions;

public interface IDefaultProductRepository
{
    Task AddAsync(DefaultProduct product, CancellationToken cancellationToken);
    Task<DefaultProduct?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<DefaultProduct>> ListCurrentAsync(string userId, CancellationToken cancellationToken);
}
