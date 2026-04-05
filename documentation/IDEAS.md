# Meal Planner + Pantry/Fridge/Freezer Ideas

This file is the single source of truth for product ideas.

## How To Add Ideas

- Add each new idea as a short bullet under the most relevant section.
- If an idea does not clearly fit, add it to `Parking lot (future ideas)` and revisit later.
- Keep notes focused on product behavior and user value, not implementation details.

## Product Goals

- Help households reduce food waste by using what they already have.
- Make meal planning faster and less mentally draining.
- Improve consistency in weekly meals without overcomplicating daily decisions.

## Target Users/Personas

- Busy households that buy groceries weekly and struggle to track freshness.
- Individuals who want structure for meals but still want flexibility.
- Budget-conscious users trying to cut waste and grocery spend.

## Core Capabilities

- Track pantry, fridge, and freezer inventory separately with quantities and dates.
- Build a weekly meal plan that can suggest meals from available ingredients.
- Generate a grocery list from planned meals plus current inventory.
- Create meals from predefined ingredients with per-ingredient usage amounts.
- Allow custom unknown ingredients in meals and review them later in a dedicated overview.
- Plan meals by week using day slots plus ad-hoc additional meals.
- Use a current-meal view to adjust actual ingredient usage before inventory is updated.
- Use metric-only measurements (`g`/`ml`) with per-package amounts for conversion between recipe usage and inventory packages.
- Require package-level confirmation of what was used, including split usage across multiple packages.

## Implementation Notes

- Detailed implementation requirements are tracked in `PRODUCT_REQUIREMENTS.md`.

## User Workflows/Journeys

- End-of-week flow: review inventory, plan meals, auto-build shopping list.
- Midweek flow: check "use soon" ingredients and re-plan one or two meals.
- Post-cooking flow: log leftovers and mark consumed ingredients.

## Risks/Challenges

- Inventory logging can feel tedious if data entry is too manual.
- Users may abandon planning if setup takes too long.
- Suggestion quality depends on ingredient and recipe data accuracy.

## Open Questions

- How much expiration tracking detail do users realistically maintain?
- What level of household collaboration is needed in v1 (shared lists/plans)?

## Parking Lot (Future Ideas)

- Barcode scanning for faster inventory updates.
- Price comparison across stores and shopping history trends.
- Nutrition and macro goals layered onto meal recommendations.
