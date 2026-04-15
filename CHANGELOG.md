# Changelog

## 2026-04-13

### Changed
- Added a reusable centered create-product dialog pattern, wired `Add Product` in `Product Catalog` to open it, updated `Unknowns` to create products in-place with source-context summary and return-to-screen success feedback, and simplified the `Action List` unknowns entry to link into the dedicated `Unknowns` page.
- Reworked the `Unknowns` wireframe into a batch-conversion flow with the action panel above the list, always-visible multi-select checkboxes, batch convert-to-catalog behavior, and a `Create New Product` route into `Product Catalog`.
- Renamed the `Today` wireframe to `Action List`, moved it to `apps/wireframes/action-list.html`, added `Urgent Ingredients` and `Unknowns` tabs, and updated wireframe navigation to point at the renamed screen.
- Simplified the `Today` wireframe by removing the `Unknowns` summary chip, making urgent filter chips always visible, and updating style guidance so lightweight view filters stay visible while heavier filter forms can still use progressive disclosure.
- Added a new `Product Catalog` wireframe screen with top-level hub/drawer navigation, hidden name/location filters, expandable product cards, and inline version-management dialogs.
- Updated wireframe navigation, project-local rules, and style guidance to treat `Product Catalog` as a first-class user-facing flow alongside `Today`, `My Stock`, `Meal Editor`, and `Unknowns`.
- Installed a user-level `rg.exe` in `C:\Users\david\AppData\Local\OpenAI\Codex\bin` so ripgrep resolves reliably in Codex sessions instead of failing from the packaged app path.

## 2026-04-12

### Added
- Added `apps/wireframes/AGENTS.md` with lean, enforceable project rules for tooling-agnostic low-fidelity wireframe work.
- Added Batch 1 wireframe prototype scaffold in `apps/wireframes` with standalone low-fi HTML/CSS/JS screens for `index`, `today`, `inventory-list`, `meal-editor`, and `unknowns`.
- Added shared wireframe behaviors for drawer navigation and per-screen default/alternate state toggles.
- Added `apps/wireframes/STYLE_GUIDE.md` to define wireframe interaction and simplicity rules.

### Changed
- Applied user-facing terminology updates across wireframes and documentation: `Default Products` -> `Product Catalog` and `Inventory` -> `My Stock`, while preserving implementation identifiers and API/schema names.
- Simplified Inventory foldout card presentation by removing nested dropdown-style header framing, switching freshness to day-based text, and removing `Last updated` detail lines.
- Simplified Inventory wireframe cards by removing per-item `-` and `View Detail` buttons, adding tap-to-expand inline detail panels with `Edit` and `Update Amount` actions, and removing the inventory undo strip.
- Removed ETag terminology from user-facing wireframes and replaced inventory conflict copy with user-friendly update wording.
- Applied progressive disclosure to wireframes: advanced Inventory search/filter and Today urgent filter controls are now hidden behind reveal buttons by default and auto-close on apply/filter actions.
- Reordered `Today` wireframe so the summary appears above urgent ingredients and now drives urgent-list filtering (`All`, `Use soon`, `Expired`).
- Added wireframe color semantics: decrement `-` controls are red and positive confirm/create actions are green, with neutral secondary/reversal controls.
- Updated wireframes to remove global quick-action reliance and use item-linked `-` quick decrement controls with immediate undo feedback.
- Fixed wireframe drawer positioning so navigation stays off-canvas when closed and only appears after opening the menu.
- Refactored `MealPlanner.Api` so task-based endpoint registrations live in separate classes for default products, inventory, meals, and unknown ingredients.
- Slimmed `Program.cs` down to host composition, middleware, host-only routes, and endpoint registration calls.
- Moved shared API helpers for OpenAPI setup, request header extraction, and ETag formatting into dedicated support types with no intended behavior change.

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
