using MealPlanner.Application.Abstractions;
using MealPlanner.Application.Inventory;
using MealPlanner.Domain.Inventory;
using MealPlanner.Domain.Meals;

namespace MealPlanner.Application.Meals;

public sealed record MealIngredientLineDto(
    Guid Id,
    string IngredientKind,
    Guid? DefaultProductId,
    Guid? UnknownIngredientId,
    decimal Amount,
    string Unit,
    string DisplayName,
    int SortOrder);

public sealed record MealDefinitionDto(
    Guid Id,
    string Name,
    IReadOnlyList<MealIngredientLineDto> IngredientLines);

public sealed record UpsertMealIngredientLineRequest(
    string IngredientKind,
    Guid? DefaultProductId,
    Guid? UnknownIngredientId,
    string? UnknownDisplayName,
    string? UnknownUnit,
    decimal Amount);

public sealed record CreateMealRequest(string Name, IReadOnlyList<UpsertMealIngredientLineRequest> IngredientLines);
public sealed record UpdateMealRequest(string Name, IReadOnlyList<UpsertMealIngredientLineRequest> IngredientLines);

public sealed record UnknownIngredientMealReferenceDto(Guid MealId, string MealName);

public sealed record UnknownIngredientOverviewDto(
    Guid Id,
    string DisplayName,
    string NormalizedName,
    string Unit,
    IReadOnlyList<UnknownIngredientMealReferenceDto> MealReferences);

public sealed record ConvertUnknownIngredientRequest(Guid UnknownIngredientId, Guid DefaultProductId);

public sealed class MealService
{
    private readonly IMealDefinitionRepository _mealDefinitions;
    private readonly IUnknownIngredientRepository _unknownIngredients;
    private readonly IDefaultProductRepository _defaultProducts;
    private readonly IApplicationDbContext _dbContext;

    public MealService(
        IMealDefinitionRepository mealDefinitions,
        IUnknownIngredientRepository unknownIngredients,
        IDefaultProductRepository defaultProducts,
        IApplicationDbContext dbContext)
    {
        _mealDefinitions = mealDefinitions;
        _unknownIngredients = unknownIngredients;
        _defaultProducts = defaultProducts;
        _dbContext = dbContext;
    }

    public async Task<MealDefinitionDto> CreateAsync(string userId, CreateMealRequest request, CancellationToken cancellationToken)
    {
        if (request.IngredientLines.Count == 0)
        {
            throw new DomainValidationException("Meal must contain at least one ingredient line.");
        }

        var mealId = Guid.NewGuid();
        var lines = await ResolveLinesAsync(userId, mealId, request.IngredientLines, cancellationToken);
        var meal = MealDefinition.Create(userId, request.Name, lines, mealId);

        await _mealDefinitions.AddAsync(meal, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(meal);
    }

    public async Task<MealDefinitionDto> UpdateAsync(string userId, Guid id, UpdateMealRequest request, CancellationToken cancellationToken)
    {
        var meal = await _mealDefinitions.GetByIdAsync(id, userId, cancellationToken)
            ?? throw new NotFoundException("Meal not found.");

        var lines = await ResolveLinesAsync(userId, meal.Id, request.IngredientLines, cancellationToken);
        meal.Replace(request.Name, lines);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(meal);
    }

    public async Task<IReadOnlyList<MealDefinitionDto>> ListAsync(string userId, CancellationToken cancellationToken)
    {
        var items = await _mealDefinitions.ListAsync(userId, cancellationToken);
        return items.Select(ToDto).ToArray();
    }

    public async Task<MealDefinitionDto> GetByIdAsync(string userId, Guid id, CancellationToken cancellationToken)
    {
        var meal = await _mealDefinitions.GetByIdAsync(id, userId, cancellationToken)
            ?? throw new NotFoundException("Meal not found.");

        return ToDto(meal);
    }

    public async Task<IReadOnlyList<UnknownIngredientOverviewDto>> ListUnknownIngredientsAsync(string userId, CancellationToken cancellationToken)
    {
        var unknowns = await _unknownIngredients.ListActiveAsync(userId, cancellationToken);
        var references = await _mealDefinitions.ListUnknownReferencesAsync(userId, cancellationToken);

        var referencesByUnknown = references
            .GroupBy(x => x.UnknownIngredientId)
            .ToDictionary(
                x => x.Key,
                x => (IReadOnlyList<UnknownIngredientMealReferenceDto>)x
                    .Select(r => new UnknownIngredientMealReferenceDto(r.MealId, r.MealName))
                    .ToArray());

        return unknowns.Select(unknown => new UnknownIngredientOverviewDto(
                unknown.Id,
                unknown.DisplayName,
                unknown.NormalizedName,
                MeasurementTypeMapper.ToApiValue(unknown.MeasurementTypeId),
                referencesByUnknown.TryGetValue(unknown.Id, out var value) ? value : []))
            .ToArray();
    }

    public async Task ConvertUnknownIngredientAsync(string userId, ConvertUnknownIngredientRequest request, CancellationToken cancellationToken)
    {
        var unknown = await _unknownIngredients.GetByIdAsync(request.UnknownIngredientId, userId, cancellationToken)
            ?? throw new NotFoundException("Unknown ingredient not found.");

        if (unknown.Status != UnknownIngredientStatus.Active)
        {
            throw new DomainValidationException("Unknown ingredient is already converted.");
        }

        var target = await _defaultProducts.GetByIdAsync(request.DefaultProductId, userId, cancellationToken)
            ?? throw new DomainValidationException("Default product is required and must exist.");

        unknown.MarkConverted(target.Id);
        await _mealDefinitions.ConvertUnknownLinesToKnownAsync(
            userId,
            unknown.Id,
            target.Id,
            target.MeasurementTypeId,
            target.Name,
            cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<MealIngredientLine>> ResolveLinesAsync(
        string userId,
        Guid mealId,
        IReadOnlyList<UpsertMealIngredientLineRequest> requestLines,
        CancellationToken cancellationToken)
    {
        if (requestLines.Count == 0)
        {
            throw new DomainValidationException("Meal must contain at least one ingredient line.");
        }

        var lines = new List<MealIngredientLine>(requestLines.Count);
        for (var i = 0; i < requestLines.Count; i++)
        {
            var request = requestLines[i];
            var kind = ParseIngredientKind(request.IngredientKind);
            if (kind == MealIngredientKind.Known)
            {
                if (request.DefaultProductId is null)
                {
                    throw new DomainValidationException("Known ingredient line requires DefaultProductId.");
                }

                var defaultProduct = await _defaultProducts.GetByIdAsync(request.DefaultProductId.Value, userId, cancellationToken)
                    ?? throw new DomainValidationException("Known ingredient must reference a valid default product.");

                lines.Add(MealIngredientLine.CreateKnown(
                    mealId,
                    userId,
                    defaultProduct.Id,
                    request.Amount,
                    defaultProduct.MeasurementTypeId,
                    defaultProduct.Name,
                    i));

                continue;
            }

            var unknownIngredient = await ResolveUnknownIngredientAsync(userId, request, cancellationToken);
            lines.Add(MealIngredientLine.CreateUnknown(
                mealId,
                userId,
                unknownIngredient.Id,
                request.Amount,
                unknownIngredient.MeasurementTypeId,
                unknownIngredient.DisplayName,
                i));
        }

        return lines;
    }

    private async Task<UnknownIngredient> ResolveUnknownIngredientAsync(
        string userId,
        UpsertMealIngredientLineRequest request,
        CancellationToken cancellationToken)
    {
        if (request.UnknownIngredientId.HasValue)
        {
            var byId = await _unknownIngredients.GetByIdAsync(request.UnknownIngredientId.Value, userId, cancellationToken)
                ?? throw new DomainValidationException("Unknown ingredient does not exist.");

            if (byId.Status != UnknownIngredientStatus.Active)
            {
                throw new DomainValidationException("Unknown ingredient has already been converted.");
            }

            return byId;
        }

        if (string.IsNullOrWhiteSpace(request.UnknownDisplayName))
        {
            throw new DomainValidationException("UnknownDisplayName is required for new unknown ingredient lines.");
        }

        if (string.IsNullOrWhiteSpace(request.UnknownUnit))
        {
            throw new DomainValidationException("UnknownUnit is required for new unknown ingredient lines.");
        }

        var normalized = UnknownIngredientNormalizer.Normalize(request.UnknownDisplayName);
        var existing = await _unknownIngredients.GetActiveByNormalizedNameAsync(userId, normalized, cancellationToken);
        var measurementTypeId = MeasurementTypeMapper.ParseId(request.UnknownUnit);

        if (existing is not null)
        {
            if (existing.MeasurementTypeId != measurementTypeId)
            {
                throw new DomainValidationException("Unknown ingredient already exists with a different unit.");
            }

            return existing;
        }

        var created = UnknownIngredient.Create(userId, request.UnknownDisplayName, measurementTypeId);
        await _unknownIngredients.AddAsync(created, cancellationToken);
        return created;
    }

    private static MealIngredientKind ParseIngredientKind(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "known" => MealIngredientKind.Known,
            "unknown" => MealIngredientKind.Unknown,
            _ => throw new DomainValidationException("IngredientKind must be 'known' or 'unknown'."),
        };
    }

    private static MealDefinitionDto ToDto(MealDefinition meal)
    {
        return new MealDefinitionDto(
            meal.Id,
            meal.Name,
            meal.IngredientLines
                .OrderBy(x => x.SortOrder)
                .Select(line => new MealIngredientLineDto(
                    line.Id,
                    line.IngredientKind.ToApiValue(),
                    line.DefaultProductId,
                    line.UnknownIngredientId,
                    line.Amount,
                    MeasurementTypeMapper.ToApiValue(line.MeasurementTypeId),
                    line.DisplayName,
                    line.SortOrder))
                .ToArray());
    }
}
