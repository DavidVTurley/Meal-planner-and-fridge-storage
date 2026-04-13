# Wireframe Style Guide

## Core Principles
- Keep actions context-linked to the card or item they affect.
- Prefer simple overview-first layouts with low clutter.
- Keep wireframes low-fidelity and behavior-focused.

## Interaction Rules
- Avoid global action clusters for item-specific actions.
- Inventory cards should be tappable and reveal details inline.
- Avoid redundant per-card action buttons when card tap already reveals details.
- Inventory expand/collapse should read as one continuous folding card (no nested bordered dropdown header).
- Inventory freshness should be shown as days left/overdue.
- Omit `Last updated` from inventory expanded details in this wireframe stage.
- Every quick decrement must expose an immediate `Undo` action.
- On `Today`, summary controls can drive filtering for the urgent list beneath it.
- Advanced controls should be hidden behind reveal buttons by default.
- Core overview information must be visible without opening advanced controls.
- Advanced panels should open inline and close after primary apply/filter actions.

## Color Semantics
- Red is reserved for destructive or reduction actions (for example, item `-` decrement).
- Green is reserved for positive confirm/create actions (for example, Save, Convert, Create, Apply).
- Neutral styles are used for navigation, secondary controls, and reversal actions (for example, Undo).

## Quick Decrement Standard
- `piece`: decrement by `1`.
- `g` and `ml`: decrement by `50`.
- Urgent ingredient cards use full visible unit removal in this prototype.

## Scope Notes
- These rules apply to `apps/wireframes` only.
- Behaviors are mock UI interactions and do not call backend APIs.
