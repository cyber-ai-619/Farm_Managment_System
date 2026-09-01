# Team Workflow

## Branching

- Use one feature branch per module or feature slice.
- Suggested naming pattern: `feature/<module-name>`.

## Collaboration rules

- Keep the API contract stable while frontend work is in progress.
- Store schema decisions in `docs/backend/schema.md` before coding around them.
- Document disagreements in the docs folder instead of hiding them in code comments.

## Pull request checklist

- folder structure is respected
- feature scope is clear
- API response shape is documented
- no files are placed outside the agreed module folder unless they are shared infrastructure

## Suggested first delivery order

1. authentication and user roles
2. farm and field management
3. crop and livestock data
4. inventory and procurement
5. harvest, sales, and finance
6. weather, alerts, and analytics

