# Title

Implementation Plan History Policy

# Date/time

2026-04-05 02:37 (Europe/Amsterdam)

# Context/request

User request: "PLEASE IMPLEMENT THIS PLAN" for plan archival policy.

# <proposed_plan>

```md
## Implementation Plan History Policy

### Summary
Standardize plan archival in a repo-root folder named `implementation history`, and record every future implementation plan as a timestamped Markdown file.

### Key Changes
- Create folder at repo root: `implementation history/`.
- Save the current plan as the first entry in that folder.
- File naming convention for all future plans:
  - `YYYY-MM-DD_HHMM_<short-kebab-title>.md` (Europe/Amsterdam time).
- Each saved plan file should include:
  - Title
  - Date/time
  - Context/request
  - Full `<proposed_plan>` content
- Keep plans append-only (never overwrite old entries).

### Ongoing Rule
- For every future implementation plan we produce, automatically save a new file in `implementation history/` using the naming convention above.

### Assumptions
- Folder location is confirmed as repo root.
- “All future implementation plans” applies to this repository unless you tell me otherwise.
```
