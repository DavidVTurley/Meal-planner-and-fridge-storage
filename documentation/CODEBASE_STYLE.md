# Codebase Style Guide (v1)

## Architecture

- Clean Architecture boundaries:
  - `MealPlanner.Domain`: business rules and invariants only.
  - `MealPlanner.Application`: use cases and orchestration.
  - `MealPlanner.Infrastructure`: EF Core, PostgreSQL, repository implementations.
  - `MealPlanner.Api`: HTTP contracts, header handling, ProblemDetails mapping.
- Domain must not depend on Application, Infrastructure, or ASP.NET types.
- API/controllers/minimal endpoints must not contain business logic.

## C# Conventions

- Nullable reference types are enabled.
- Implicit usings are enabled.
- Warnings are treated as errors.
- File-scoped namespaces.
- Naming:
  - `PascalCase` for types/members.
  - `_camelCase` for private fields.
  - `camelCase` for locals/parameters.

## API Conventions

- Use `X-User-Id` header for current user boundary in v1.
- Errors return RFC7807 ProblemDetails.
- Inventory write operations requiring concurrency must use `If-Match` and return/refresh `ETag`.
- Units are metric-only and constrained to `g` and `ml`.

## Data Conventions

- One `inventory_item` row represents one physical package.
- `default_product` edits are append-only version rows.
- Location is stored as both:
  - canonical normalized (`LocationCanonical`) for logic/filtering
  - display input (`LocationDisplay`) for UX.
- Snapshot package fields on inventory items are immutable after creation.

## Testing Standards

- Domain invariant tests are required for business rules.
- Integration tests are required for key application behaviors and persistence paths.
- Minimum command set:
  - `dotnet restore MealPlanner.slnx --configfile NuGet.Config`
  - `dotnet build MealPlanner.slnx --no-restore -m:1`
  - `dotnet test tests/MealPlanner.Domain.Tests/MealPlanner.Domain.Tests.csproj --no-build --no-restore -m:1`
  - `dotnet test tests/MealPlanner.IntegrationTests/MealPlanner.IntegrationTests.csproj --no-build --no-restore -m:1`
