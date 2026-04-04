# Meal Planner Implementation

This document captures implementation-ready product behavior. Each part is separated so work can be planned and delivered incrementally.

## Part 1: Inventory Add Flow (Mandatory Default Association)

### Goal

Ensure every saved inventory item is tied to a default product.

### Requirements

- User must select an existing default product or create a new one before saving an inventory item.
- Saving an inventory item without a default association is blocked.
- This rule applies equally to pantry, fridge, and freezer.

### Acceptance

- Known default path: user selects an existing default and can save.
- Unknown default path: user cannot save until a default is created.

## Part 2: Default Product Management

### Goal

Speed up repeat item entry by storing reusable per-user defaults.

### Requirements

- Defaults are personal to each user (not shared in v1).
- Defaults are editable templates used when creating future pantry entries.
- Required default fields:
  - Product name
  - Default shelf-life days
  - Amount per package
  - Measurement unit (`g` or `ml`)
- Editing a default product (for example, changing package amount from 1000g to 800g) applies only to new pantry entries created after the change.
- On first-time ingredient use, system attempts to infer default values from the user's same-ingredient history (recent pantry/default records).
- If inference is reliable, inferred default fields are prefilled.
- Prefilled inferred values remain editable by the user before save.
- If inference is not reliable, first-time save is blocked until user enters all required default fields (`default shelf-life days`, `amount per package`, `measurement unit`).
- No system-wide fallback defaults are used when inference is not reliable.
- During item add, sell-by date auto-fills as `date added + default shelf-life days`.
- User can override the auto-filled sell-by date before save.

### Acceptance

- Default with 10 shelf-life days auto-fills sell-by to 10 days after add date.
- User override of sell-by persists when item is saved.
- Default edit isolation: changing a default package amount affects new entries only.
- Inference success: previously used ingredient pre-fills default values from same-ingredient user history, and user can edit before save.
- Inference failure: first-time ingredient with no reliable same-ingredient history requires full default input before save is allowed.

## Part 3: Inventory Item Data Model

### Goal

Capture consistent item data needed for tracking and freshness workflows.

### Required Fields

- Ingredient name
- Package quantity (whole packages)
- Partial amount (allowed values: `0`, `1/4`, `1/2`, `3/4`, `1`)
- Amount per package (snapshot value captured at pantry-entry creation)
- Measurement unit (`g` or `ml`, snapshot value captured at pantry-entry creation)
- Location (`pantry`, `fridge`, `freezer`)
- Sell-by date
- Linked default product

### Snapshot Rules

- Pantry entries persist their own snapshot package amount and unit from creation time.
- Snapshot fields on pantry entries do not change when the linked default product is edited later.

### Acceptance

- System rejects save if any required field is missing.
- Partial values outside allowed set are rejected.
- Units outside `g` and `ml` are rejected.
- If default changes from 1000g to 800g, existing pantry entries created at 1000g remain 1000g.

## Part 4: Freshness And Status Rules

### Goal

Provide clear, date-driven urgency signals for food usage.

### Requirements

- `Use soon` begins 3 days before sell-by date.
- `Expired` begins after sell-by date.
- Status calculation updates based on current date and sell-by date.

### Acceptance

- Item transitions from normal to `Use soon` at T-3 days.
- Item transitions to `Expired` after sell-by date passes.

## Part 5: Quantity Update Behavior

### Goal

Keep inventory counts accurate through explicit user updates.

### Requirements

- Duplicate adds remain separate entries (no merge behavior in v1).
- Quantity reduction after usage is manual decrement.

### Acceptance

- Adding same item with same location/date creates a separate record.
- User can manually decrement package/partial amounts after use.

## Part 6: V1 Validation Scenarios

### End-To-End Scenarios

- Add item from known default in pantry and save successfully.
- Add unknown fridge item, create default inline, then save.
- Override auto-filled sell-by during freezer item add and save.
- Verify freshness state transitions over time for saved items.
- Verify manual decrement updates item quantity without merging records.

## Part 7: Meal Definition And Meal List

### Goal

Allow users to create meals and add them to a meal list using known ingredients with explicit usage amounts.

### Requirements

- User can create a meal record with a meal name.
- User can add a meal to a meal list (planning list).
- Each meal supports multiple ingredient lines.
- Ingredient lines can reference predefined known ingredients.
- Each ingredient line requires:
  - A usage mode (`package` or `measurement`)
  - A defined usage amount
  - If `measurement` mode is used, unit must be `g` or `ml`
- Imperial units are not supported in v1.

### Acceptance

- User creates a meal with at least one known ingredient and amount, then adds it to the meal list.
- Meal list shows the added meal and its ingredient composition.
- Meal ingredient lines accept package-based amounts and metric measurement amounts.

## Part 8: Unknown Ingredient Capture

### Goal

Support meal entry even when an ingredient is not yet defined in the known ingredient set.

### Requirements

- User can add custom/unknown ingredients directly while defining a meal.
- Unknown ingredient lines still require a usage amount.
- Unknown ingredients are marked distinctly from known ingredients.

### Acceptance

- User adds a meal containing both known and unknown ingredients and saves successfully.
- Unknown ingredient entries are visibly identifiable in the saved meal.

## Part 9: Unknown Ingredient Overview And Conversion

### Goal

Provide a dedicated overview so unknown ingredients can be resolved later into known ingredients.

### Requirements

- System provides an overview list of unknown ingredients used in meals.
- Overview includes where each unknown ingredient is currently used (meal references).
- User can later convert an unknown ingredient into a known predefined ingredient.
- After conversion, linked meal ingredient lines use the known ingredient reference.

### Acceptance

- Unknown overview lists all unknown ingredients currently present in meal definitions.
- User converts one unknown ingredient to known and sees the reference update in associated meals.
- Unknown overview no longer lists converted ingredients without remaining unknown references.

## Part 10: Weekly Planner

### Goal

Schedule predefined meals in a weekly plan with both fixed meal slots and flexible ad-hoc additions.

### Requirements

- Planner is week-based and supports a user-defined week start day.
- Each day includes fixed slots: `Breakfast`, `Lunch`, `Dinner`.
- Each day also includes an `Additional Meals` list for ad-hoc meals.
- User can add predefined meals into any fixed slot.
- User can add extra ad-hoc meals directly to a day's `Additional Meals` list.
- The same predefined meal can appear multiple times in a week.

### Acceptance

- User creates a week plan with meals in fixed slots and at least one ad-hoc additional meal.
- Week view reflects the user's configured week start day.
- Repeated use of the same meal in multiple day entries is allowed.

## Part 11: Current Meal Execution And Substitution

### Goal

Provide a real-world cooking view where planned recipes can be executed, substituted, and adjusted.

### Requirements

- User can start `Current Meal` from any planned slot or ad-hoc additional meal.
- User can also start an ad-hoc cooking session directly from planner context.
- Current meal view shows planned ingredients and planned amounts.
- User can adjust actual used amounts per ingredient line.
- User can substitute the selected planned meal at cook time.
- Substitution replaces the selected planner entry with the newly chosen meal.
- Unknown ingredients can be added during execution and are captured as unknown entries.

### Acceptance

- User starts a planned meal, edits actual amounts, and keeps changes before completion.
- User substitutes a planned meal and sees the slot updated to the replacement meal.
- User adds an unknown ingredient while cooking and it is saved as unknown.

## Part 12: Inventory Impact From Meal Completion

### Goal

Ensure inventory reflects real usage by applying adjusted actual amounts only when cooking is finished.

### Requirements

- Inventory updates are triggered only when user marks current meal as completed.
- Inventory deduction uses actual adjusted amounts, not original planned amounts.
- Deduction supports two usage modes:
  - `package` mode: deduct package/partial package directly.
  - `measurement` mode: convert to package depletion using selected pantry package snapshot `amount per package` and metric unit.
- Conversion uses metric-only units (`g`, `ml`) and does not support imperial units.
- Meal completion requires explicit usage allocation to concrete inventory items (packages) for each ingredient line.
- User cannot confirm meal completion until all ingredient usage is fully allocated.
- Allocation supports multi-package usage for a single ingredient line (split across multiple packages).
- Measurement conversion uses selected allocated pantry packages, not the current default-product package amount.
- Mixed-size allocations are supported in one ingredient line (for example, one legacy 1000g package and one newer 800g package).
- Unknown ingredients added during execution are queued to Unknown Ingredient Overview.
- Existing unknown-ingredient conversion behavior remains the resolution path.

### Acceptance

- Inventory does not change while user is still editing current meal amounts.
- Completing meal applies deductions that match actual entered values.
- Unknown ingredients captured during completion appear in the unknown overview.
- Measurement-based usage deducts inventory according to per-package conversion in metric units.
- If one package is insufficient, user can allocate remaining usage to additional packages and still complete the meal.
- Completion is blocked when any ingredient line has unallocated usage.
- In mixed-size allocation (1000g + 800g), deduction uses each selected package snapshot size.

## Part 13: Meal Usage Allocation (Package-Level Confirmation)

### Goal

Ensure real inventory depletion is accurate by forcing users to confirm exactly which inventory packages were used.

### Requirements

- During meal completion, each ingredient line enters an allocation step.
- User must select one or more specific pantry inventory items/packages that satisfy the ingredient usage.
- Split allocation is supported across multiple packages for the same ingredient.
- Allocation can mix full and partial package consumption.
- Allocation must total the full actual usage amount before confirmation is allowed.
- If exactly one eligible inventory item exists for an ingredient line, allocation auto-fills to that item.
- Auto-filled allocation remains editable by the user before final confirmation.
- Allocation identity is package-specific and always uses the selected package snapshot amount-per-package for conversion.

### Acceptance

- Example flow: ingredient requires 1 package total, package A has 1/2 remaining, user allocates 1/2 from package A and 1/2 from package B.
- System accepts completion only when allocation totals match the actual usage for each ingredient line.
- System rejects over-allocation or under-allocation and keeps completion blocked until corrected.
- Single-match flow: when only one eligible package exists, system preselects it and auto-fills the required allocation.
