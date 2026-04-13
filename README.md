# Meal Planner + Pantry/Fridge/Freezer Tracker

## Project Purpose

This project defines a pantry-first meal planning product.

Primary value:
- Reduce food waste
- Keep pantry/fridge/freezer stock accurate
- Support realistic cooking behavior (actual usage, substitutions, split-package usage)

## Document Map

- `documentation/IDEAS.md`: high-level product ideas, goals, risks, and future thoughts.
- `documentation/PRODUCT_REQUIREMENTS.md`: implementation-ready product behavior and acceptance criteria for v1.
- `documentation/TECHNICAL_SPEC_INVENTORY_FOUNDATION.md`: locked implementation plan for v1 My Stock foundation architecture and rules.
- `documentation/TECHNICAL_SPEC_MEAL_DEFINITION_AND_UNKNOWNS.md`: locked implementation plan for v1 meal definition and unknown ingredient handling.
- `documentation/CODEBASE_STYLE.md`: codebase architecture, coding standards, and API/data/testing conventions.

## V1 Scope

In scope:
- Pantry/fridge/freezer My Stock tracking with per-package entries
- Product Catalog templates with manual first-use defaults (no inference in v1)
- Sell-by freshness states (`Use soon`, `Expired`)
- Meal definition with known + unknown ingredients
- Weekly planner (Breakfast/Lunch/Dinner + additional ad-hoc meals)
- Current meal execution with actual usage adjustment
- Package-level allocation at meal completion
- Canonical usage units (`g`/`ml`/`piece`) with decimal amounts

Out of scope:
- Grocery list generation behavior (tracked as future placeholder)
- Nutrition/macro planning
- Price comparison and shopping cost analytics
- Barcode scanning
- Household collaboration features

## Glossary

- `Product Catalog item`: user-editable template for future pantry entries (name, shelf-life, amount-per-package, unit).
- `My Stock item`: one physical package stored in a user location with snapshot values.
- `Snapshot values`: package amount and unit captured at entry creation; not rewritten by later default edits.
- `Stock-tracked ingredient`: ingredient line that must allocate to pantry packages before meal completion.
- `Unknown ingredient / non-stock usage`: ingredient captured during meal flow without pantry allocation; queued for later resolution.
- `Use package` shortcut: UI action that consumes 100% of currently remaining amount on the selected package.

## Implementation Priority Order

1. My Stock foundation
   - Parts 1-5 in `documentation/PRODUCT_REQUIREMENTS.md`
2. Meal definition and unknown handling
   - Parts 7-9
3. Weekly planning and execution
   - Parts 10-13
4. Cross-cutting validation
   - Part 6 scenarios
5. Future work alignment
   - Part 14 placeholder (grocery list)

## Database Migrations (EF Core)

Migrations are configured in `src/MealPlanner.Infrastructure` using `MealPlannerDbContextFactory`.

Commands:

```powershell
$env:DOTNET_CLI_HOME='C:\Users\david\source\repos\Meal planner and fridge storage\.dotnet'
$env:NUGET_PACKAGES='C:\Users\david\source\repos\Meal planner and fridge storage\.nuget\packages'
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE='1'

# Optional: override DB connection used by migration tooling
$env:MEALPLANNER_DB_CONNECTION='Server=(localdb)\MSSQLLocalDB;Database=meal_planner;Trusted_Connection=True;TrustServerCertificate=True'

# Add migration
.\.dotnet\tools\dotnet-ef migrations add <MigrationName> --no-build --project src/MealPlanner.Infrastructure/MealPlanner.Infrastructure.csproj --context MealPlannerDbContext --output-dir Persistence/Migrations

# Apply migration
.\.dotnet\tools\dotnet-ef database update --no-build --project src/MealPlanner.Infrastructure/MealPlanner.Infrastructure.csproj --context MealPlannerDbContext
```

## UI Testing Harness (`/ui`)

The API now serves a lightweight test UI for manual end-to-end checks against your local database.

1. Run the API:

```powershell
$env:DOTNET_CLI_HOME='C:\Users\david\source\repos\Meal planner and fridge storage\.dotnet'
$env:NUGET_PACKAGES='C:\Users\david\source\repos\Meal planner and fridge storage\.nuget\packages'
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE='1'
dotnet run --project src/MealPlanner.Api/MealPlanner.Api.csproj
```

2. Open the test UI in your browser:
   - `http://localhost:5192/ui`

3. Key request requirements:
   - `/api/*` endpoints require `X-User-Id` (configurable in the UI's global request settings).
   - Manual decrement requires `If-Match` with a quoted ETag value (for example `"abc123"`). The UI captures and reuses ETags from API responses.
