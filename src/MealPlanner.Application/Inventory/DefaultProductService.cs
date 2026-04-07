using MealPlanner.Domain.Inventory;

namespace MealPlanner.Application.Inventory;

public sealed record DefaultProductDto(
    Guid Id,
    string Name,
    int DefaultShelfLifeDays,
    decimal AmountPerPackage,
    string Unit,
    string? DefaultLocation,
    int Version,
    bool IsCurrent,
    Guid? PreviousVersionId);

public sealed record CreateDefaultProductRequest(
    string Name,
    int DefaultShelfLifeDays,
    decimal AmountPerPackage,
    string Unit,
    string? DefaultLocation = null);

public sealed record UpdateDefaultProductRequest(
    string Name,
    int DefaultShelfLifeDays,
    decimal AmountPerPackage,
    string Unit,
    string? DefaultLocation = null);

public sealed class DefaultProductService
{
    private readonly Abstractions.IDefaultProductRepository _defaultProducts;
    private readonly Abstractions.IApplicationDbContext _dbContext;

    public DefaultProductService(Abstractions.IDefaultProductRepository defaultProducts, Abstractions.IApplicationDbContext dbContext)
    {
        _defaultProducts = defaultProducts;
        _dbContext = dbContext;
    }

    public async Task<DefaultProductDto> CreateAsync(string userId, CreateDefaultProductRequest request, CancellationToken cancellationToken)
    {
        var measurementTypeId = MeasurementTypeMapper.ParseId(request.Unit);
        var created = DefaultProduct.Create(
            userId,
            request.Name,
            request.DefaultShelfLifeDays,
            request.AmountPerPackage,
            measurementTypeId,
            request.DefaultLocation);

        await _defaultProducts.AddAsync(created, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(created);
    }

    public async Task<DefaultProductDto> CreateNextVersionAsync(string userId, Guid defaultProductId, UpdateDefaultProductRequest request, CancellationToken cancellationToken)
    {
        var existing = await _defaultProducts.GetByIdAsync(defaultProductId, userId, cancellationToken)
            ?? throw new NotFoundException("Default product not found.");

        if (!existing.IsCurrent)
        {
            throw new DomainValidationException("Only current default products can be edited.");
        }

        var measurementTypeId = MeasurementTypeMapper.ParseId(request.Unit);
        var next = existing.CreateNextVersion(
            request.Name,
            request.DefaultShelfLifeDays,
            request.AmountPerPackage,
            measurementTypeId,
            request.DefaultLocation);

        await _defaultProducts.AddAsync(next, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(next);
    }

    public async Task<IReadOnlyList<DefaultProductDto>> ListCurrentAsync(string userId, CancellationToken cancellationToken)
    {
        var items = await _defaultProducts.ListCurrentAsync(userId, cancellationToken);
        return items.Select(ToDto).ToArray();
    }

    private static DefaultProductDto ToDto(DefaultProduct product)
    {
        return new DefaultProductDto(
            product.Id,
            product.Name,
            product.DefaultShelfLifeDays,
            product.AmountPerPackage,
            MeasurementTypeMapper.ToApiValue(product.MeasurementTypeId),
            product.DefaultLocationDisplay,
            product.Version,
            product.IsCurrent,
            product.PreviousVersionId);
    }
}
