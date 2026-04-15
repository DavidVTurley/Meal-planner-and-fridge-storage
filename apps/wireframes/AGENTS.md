# AGENTS.md

## Purpose
- This project is for tooling-agnostic, low-fidelity UI wireframes.

## Scope
- Cover current API-supported flows only: `Action List`, `Product Catalog`, `My Stock`, `Meals`, `Unknowns`, `Settings`.
- Do not implement planner, current-meal, or allocation screens yet.

## Fidelity
- Keep wireframes low-fi and structure-first (layout, hierarchy, actions, state variants).
- Avoid high-fidelity branding and visual polish in this phase.

## Structure
- Use standalone HTML/CSS files with a simple screen hub (`index.html`).
- Keep file names predictable and flow-oriented.

## States
- Include key states where relevant: default, loading, empty, error, validation/conflict.

## Process
- Update `CHANGELOG.md` whenever files are added or changed.
