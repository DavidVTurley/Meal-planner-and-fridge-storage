# Changelog

## 2026-04-05

### Added
- Enabled OpenAPI document generation and a lightweight Swagger UI page in development mode at `/openapi`.
- Added endpoint documentation metadata (summaries/descriptions) for health, default-products, and inventory routes.
- Added OpenAPI header metadata for required `X-User-Id` and `If-Match` (manual decrement flow).

### Changed
- Fixed OpenAPI type usage for current package versions (`Microsoft.OpenApi` 2.x API surface).
- Replaced obsolete `WithOpenApi(...)` operation mutation calls with `AddOpenApiOperationTransformer(...)`.
- Removed `Swashbuckle.AspNetCore` dependency due runtime incompatibility in this stack.

### Build Log (Condensed)
- `dotnet restore MealPlanner.slnx --configfile NuGet.Config -v minimal`: **Succeeded**.
  - Restored projects: `MealPlanner.Domain`, `MealPlanner.Application`, `MealPlanner.Infrastructure`, `MealPlanner.Api`, `MealPlanner.Domain.Tests`, `MealPlanner.IntegrationTests`.
- `dotnet build MealPlanner.slnx --no-restore -v minimal -m:1`: **Succeeded**.
- Default parallel build in this environment still intermittently fails with silent output (`Build FAILED`, `0 Warning(s)`, `0 Error(s)`); serial build (`-m:1`) provides reliable diagnostics and succeeds.
- API runtime verification: `http://localhost:5192/openapi/v1.json` and `http://localhost:5192/openapi` both returned HTTP `200`.

### Files Updated
- `src/MealPlanner.Api/MealPlanner.Api.csproj`
- `src/MealPlanner.Api/Program.cs`
