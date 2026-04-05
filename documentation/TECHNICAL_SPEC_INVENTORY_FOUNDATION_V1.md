# Inventory Foundation v3 (Locked Spec, .NET 10 with .NET 11 Readiness)

## Summary

- Implement requirements `Parts 1-5` first using `.NET 10`, `ASP.NET Core Web API`, `EF Core`, and `PostgreSQL`.
- Use API-first architecture (backend first, web/native clients following same contracts).
- Keep `inventory_item` as the physical-package entity.
- Use append-only default-product versioning.
- Store location as normalized string for logic, with user-input display value for UX.
- Enforce user scoping from day one via seeded local user boundary (`UserId`) to support future online and household collaboration.

## Core Implementation Rules

- **Platform strategy:** `.NET 10` is the production baseline. Add a non-blocking `.NET 11` CI lane (build/tests) to surface compatibility issues early.
- **Enum vs string governance:** If a field choice between enum and string is ambiguous in requirements, clarification is required before implementation. Enforce via ADR + PR checklist.
- **Units:** canonical metric only (`g`, `ml`) with domain validation.
- **Freshness time semantics:** date-only evaluation in user timezone (not server-local/UTC timestamp semantics).

## Data Model And Contracts

- **`default_product` (append-only versioned):**
  - Fields: `Id`, `UserId`, `Name`, `DefaultShelfLifeDays`, `AmountPerPackage`, `Unit`, `Version`, `PreviousVersionId` (nullable self-FK), `IsCurrent`, timestamps.
  - Update behavior: edits create a new version row; previous versions become non-current and immutable.
  - Existing `inventory_item` records keep their original linked version and snapshot values.
- **`inventory_item` (physical package):**
  - Fields: `Id`, `UserId`, `IngredientName`, `RemainingAmountMetric`, `SnapshotAmountPerPackage`, `SnapshotUnit`, `LocationCanonical`, `LocationDisplay`, `DateAdded`, `SellByDate`, `DefaultProductId`, concurrency token, timestamps.
  - Snapshot rule: snapshot fields never change after creation.
  - Duplicate adds remain separate rows (no merge in v1).
- **Location normalization:**
  - Persist canonical normalized value for identity/filtering (trimmed + case-normalized).
  - Persist display value from user input as default UI label.
  - Logical matching/filtering uses canonical value.

## Inference Policy (Conservative, Deterministic)

- Inputs: same-user, same normalized ingredient name from historical defaults and inventory snapshots.
- Inference is allowed only when reliability passes strict thresholds (minimum evidence count + dominant consistent values across required fields).
- Any required field failing reliability is treated as missing and must be user-entered before save.
- No global/system fallback defaults.
- API returns inference diagnostics (`fields_inferred`, `source_count`, `confidence`, `manual_required_fields`) for transparency and tuning.

## API Surface (Inventory First)

- `POST /api/default-products`
- `PATCH /api/default-products/{id}` (creates next version, does not mutate old row)
- `GET /api/default-products`
- `POST /api/inventory-items`
- `PATCH /api/inventory-items/{id}/manual-decrement`
- `GET /api/inventory-items` (filters include location/freshness/search)
- `GET /api/inventory-items/{id}`
- `GET /api/inventory/default-inference?ingredientName=...`
- User boundary via `X-User-Id` for now.

## Integrity, Concurrency, And Validation

- Use optimistic concurrency on `inventory_item` updates; stale write attempts return `409 Conflict`.
- Manual decrement cannot make remaining amount negative.
- Save is blocked if required fields/default association are missing.
- Sell-by defaults to `DateAdded + DefaultShelfLifeDays`, user override allowed.

## Test Plan

- **Domain tests:** required fields, unit constraints, snapshot immutability, append-only version chain validity, location normalization behavior.
- **Application tests:** inference pass/fail paths, sell-by autofill + override, duplicate add behavior.
- **API/integration tests (PostgreSQL):** default versioning on patch, inventory creation rules, manual decrement with optimistic concurrency conflict handling.
- **Acceptance mapping:** execute `Part 6` scenarios relevant to inventory foundation.
- **CI lanes:** required `.NET 10`; non-blocking `.NET 11` compatibility lane.

## Assumptions

- This phase excludes meal/planner execution features (`Parts 7+`) except future-facing contract boundaries.
- Household collaboration is future scope, but schema/service boundaries are prepared via `UserId` isolation and stable API contracts.