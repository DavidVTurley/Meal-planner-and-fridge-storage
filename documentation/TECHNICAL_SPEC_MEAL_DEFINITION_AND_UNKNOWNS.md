# Meal Definition And Unknown Ingredient Technical Spec (.NET 10)

Spec Version: v1.0  
Last Updated: 2026-04-05

## Summary

- Implements `PRODUCT_REQUIREMENTS.md` Parts `7-9`.
- Adds meal definition with known ingredients and metric usage.
- Allows unknown ingredients during meal definition.
- Adds unknown ingredient overview and conversion flow.
- Keeps inventory allocation behavior deferred to Phase 3 (Parts 10-13).

## Core Rules

- Canonical units are `g`, `ml`, and `piece`.
- Meal ingredient lines support usage modes:
  - `measurement` (explicit metric amount)
  - `package` (shortcut mode; still stored as metric)
- Unknown ingredients are valid meal lines and are marked distinctly.
- Unknown ingredients are treated as non-stock usage until converted.
- Conversion updates linked meal lines from unknown reference to known ingredient reference.

## Data Model And Contracts

- **`meal_definition`**
  - Fields: `Id`, `UserId`, `Name`, timestamps.
- **`meal_ingredient_line`**
  - Fields: `Id`, `MealDefinitionId`, `UserId`, `IngredientKind` (`known` or `unknown`), `DefaultProductId` (nullable), `UnknownIngredientId` (nullable), `UsageMode`, `UsageAmountMetric`, `Unit`, `DisplayName`, `SortOrder`, timestamps.
  - Invariant: exactly one of `DefaultProductId` or `UnknownIngredientId` must be set.
- **`unknown_ingredient`**
  - Fields: `Id`, `UserId`, `NormalizedName`, `DisplayName`, `Status` (`active`, `converted`), `ConvertedDefaultProductId` (nullable), timestamps.
- **`meal_list_entry`**
  - Fields: `Id`, `UserId`, `MealDefinitionId`, `Source` (`manual`), timestamps.
  - Purpose in this phase: supports “add meal to meal list” behavior from Part 7.

## API Surface (Phase 2)

- `POST /api/meals`
  - Creates meal definition with ingredient lines.
- `PATCH /api/meals/{id}`
  - Updates meal name and ingredient lines.
- `GET /api/meals`
  - Lists user meal definitions.
- `GET /api/meals/{id}`
  - Returns meal and ingredient composition.
- `POST /api/meal-list`
  - Adds meal to meal list.
- `GET /api/meal-list`
  - Lists meal list entries.
- `GET /api/unknown-ingredients`
  - Lists unknown ingredients and meal references.
- `POST /api/unknown-ingredients/convert`
  - Converts unknown ingredient to known ingredient (`default_product`).

## Validation And Behavior

- Save meal requires:
  - Meal name present.
  - At least one ingredient line.
  - Every line has usage mode and metric usage amount.
  - Unit is `g`, `ml`, or `piece`.
- Unknown ingredient line behavior:
  - Stores unknown reference and display name.
  - Appears in unknown ingredient overview.
  - Does not require inventory allocation in this phase.
- Conversion behavior:
  - Conversion target must be a user-owned `default_product`.
  - Converted unknown is marked `converted`.
  - All linked meal lines are relinked to `DefaultProductId`.
  - Converted items are removed from active unknown overview.

## Test Plan

- **Domain tests**
  - Ingredient line invariants (`known` xor `unknown`).
  - Metric-only unit enforcement.
  - Required usage amount per line.
- **Application tests**
  - Create meal with known lines.
  - Create meal with mixed known/unknown lines.
  - Add meal to meal list.
  - Convert unknown ingredient and verify linked line updates.
- **API/integration tests**
  - CRUD for meals and meal list.
  - Unknown overview includes meal references.
  - Conversion endpoint updates references atomically.

## Assumptions

- User boundary remains `X-User-Id`.
- Inference remains disabled in v1 first-time flows.
- Weekly planner and current-meal execution are out of this phase and start in Phase 3.
