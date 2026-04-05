# Meal Planner + Pantry/Fridge/Freezer Tracker

## Project Purpose

This project defines a pantry-first meal planning product.

Primary value:
- Reduce food waste
- Keep pantry/fridge/freezer inventory accurate
- Support realistic cooking behavior (actual usage, substitutions, split-package usage)

## Document Map

- `documentation/IDEAS.md`: high-level product ideas, goals, risks, and future thoughts.
- `documentation/PRODUCT_REQUIREMENTS.md`: implementation-ready product behavior and acceptance criteria for v1.
- `documentation/TECHNICAL_SPEC_INVENTORY_FOUNDATION.md`: locked implementation plan for v1 inventory foundation architecture and rules.

## V1 Scope

In scope:
- Pantry/fridge/freezer inventory tracking with per-package entries
- Default product templates with manual first-use defaults (no inference in v1)
- Sell-by freshness states (`Use soon`, `Expired`)
- Meal definition with known + unknown ingredients
- Weekly planner (Breakfast/Lunch/Dinner + additional ad-hoc meals)
- Current meal execution with actual usage adjustment
- Package-level allocation at meal completion
- Metric-only canonical usage (`g`/`ml`)

Out of scope:
- Grocery list generation behavior (tracked as future placeholder)
- Nutrition/macro planning
- Price comparison and shopping cost analytics
- Barcode scanning
- Household collaboration features

## Glossary

- `Default product`: user-editable template for future pantry entries (name, shelf-life, amount-per-package, unit).
- `Inventory item`: one physical package stored in a user location with snapshot values.
- `Snapshot values`: package amount and unit captured at entry creation; not rewritten by later default edits.
- `Stock-tracked ingredient`: ingredient line that must allocate to pantry packages before meal completion.
- `Unknown ingredient / non-stock usage`: ingredient captured during meal flow without pantry allocation; queued for later resolution.
- `Use package` shortcut: UI action that consumes 100% of currently remaining amount on the selected package.

## Implementation Priority Order

1. Inventory foundation
   - Parts 1-5 in `documentation/PRODUCT_REQUIREMENTS.md`
2. Meal definition and unknown handling
   - Parts 7-9
3. Weekly planning and execution
   - Parts 10-13
4. Cross-cutting validation
   - Part 6 scenarios
5. Future work alignment
   - Part 14 placeholder (grocery list)
