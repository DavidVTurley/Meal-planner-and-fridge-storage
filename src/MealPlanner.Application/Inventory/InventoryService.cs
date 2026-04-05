using MealPlanner.Domain.Inventory;

namespace MealPlanner.Application.Inventory;

public sealed record InventoryItemDto(
    Guid Id,
    string IngredientName,
    decimal RemainingAmountMetric,
    decimal SnapshotAmountPerPackage,
    string SnapshotUnit,
    string LocationCanonical,
    string LocationDisplay,
    DateOnly DateAdded,
    DateOnly SellByDate,
    string Freshness,
    Guid DefaultProductId,
    string ETag);

public sealed record CreateInventoryItemRequest(
    string IngredientName,
    decimal RemainingAmountMetric,
    string Location,
    DateOnly DateAdded,
    DateOnly? SellByDate,
    Guid DefaultProductId);

public sealed record ManualDecrementRequest(decimal Amount);

public sealed record InventoryInferenceDto(string IngredientName, bool HasInference, string Message);

public sealed class InventoryService
{
    private readonly Abstractions.IInventoryItemRepository _inventory;
    private readonly Abstractions.IDefaultProductRepository _defaultProducts;
    private readonly Abstractions.IApplicationDbContext _dbContext;

    public InventoryService(
        Abstractions.IInventoryItemRepository inventory,
        Abstractions.IDefaultProductRepository defaultProducts,
        Abstractions.IApplicationDbContext dbContext)
    {
        _inventory = inventory;
        _defaultProducts = defaultProducts;
        _dbContext = dbContext;
    }

    public async Task<InventoryItemDto> CreateAsync(string userId, CreateInventoryItemRequest request, CancellationToken cancellationToken)
    {
        var defaultProduct = await _defaultProducts.GetByIdAsync(request.DefaultProductId, userId, cancellationToken)
            ?? throw new DomainValidationException("Default product is required and must exist.");

        var sellBy = request.SellByDate ?? request.DateAdded.AddDays(defaultProduct.DefaultShelfLifeDays);

        var item = InventoryItem.Create(
            userId,
            request.IngredientName,
            request.RemainingAmountMetric,
            defaultProduct.AmountPerPackage,
            defaultProduct.Unit,
            request.Location,
            request.DateAdded,
            sellBy,
            defaultProduct.Id);

        await _inventory.AddAsync(item, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(item, DateOnly.FromDateTime(DateTime.UtcNow));
    }

    public async Task<InventoryItemDto> ManualDecrementAsync(string userId, Guid id, string? ifMatchHeader, ManualDecrementRequest request, CancellationToken cancellationToken)
    {
        var item = await _inventory.GetByIdAsync(id, userId, cancellationToken)
            ?? throw new NotFoundException("Inventory item not found.");

        if (string.IsNullOrWhiteSpace(ifMatchHeader))
        {
            throw new DomainValidationException("If-Match header is required.");
        }

        var token = ifMatchHeader.Trim().Trim('"');
        if (!string.Equals(token, item.ConcurrencyToken, StringComparison.Ordinal))
        {
            throw new ConcurrencyConflictException("ETag is stale.");
        }

        item.ManualDecrement(request.Amount);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(item, DateOnly.FromDateTime(DateTime.UtcNow));
    }

    public async Task<InventoryItemDto> GetByIdAsync(string userId, Guid id, CancellationToken cancellationToken)
    {
        var item = await _inventory.GetByIdAsync(id, userId, cancellationToken)
            ?? throw new NotFoundException("Inventory item not found.");

        return ToDto(item, DateOnly.FromDateTime(DateTime.UtcNow));
    }

    public async Task<IReadOnlyList<InventoryItemDto>> ListAsync(string userId, string? location, string? search, CancellationToken cancellationToken)
    {
        var canonical = string.IsNullOrWhiteSpace(location) ? null : LocationNormalizer.ToCanonical(location);
        var items = await _inventory.ListAsync(userId, canonical, search, cancellationToken);
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        return items.Select(item => ToDto(item, now)).ToArray();
    }

    public InventoryInferenceDto GetDefaultInference(string ingredientName)
    {
        return new InventoryInferenceDto(ingredientName, false, "No inference in v1. Create a default product manually.");
    }

    private static InventoryItemDto ToDto(InventoryItem item, DateOnly today)
    {
        return new InventoryItemDto(
            item.Id,
            item.IngredientName,
            item.RemainingAmountMetric,
            item.SnapshotAmountPerPackage,
            item.SnapshotUnit.ToApiValue(),
            item.LocationCanonical,
            item.LocationDisplay,
            item.DateAdded,
            item.SellByDate,
            item.GetFreshnessStatus(today).ToString(),
            item.DefaultProductId,
            item.ConcurrencyToken);
    }
}
