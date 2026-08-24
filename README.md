# Farm Management System

A collaboration-friendly monorepo scaffold for a server-side web development group assignment based on the Full Farm Management System brief.

## What is in this repo

- `backend/` - plain PHP API scaffold
- `frontend/` - static web UI starter
- `database/` - schema notes, migrations, and seed placeholders
- `docs/` - assignment scope, module map, and team workflow notes
- `infra/` - Docker-based local development files

## Quick start

1. Copy the example environment file:

   ```bash
   copy .env.example .env
   ```

2. Start the local stack:

   ```bash
   docker compose -f infra/docker-compose.yml up --build
   ```

3. Open the app:

   - Frontend: `http://localhost:8080`
   - Backend health check: `http://localhost:8080/api/health`

## Repo purpose

This first version is a scaffold, not the full product. It gives the team a stable structure to split work across:

- farm and field management
- crop management
- irrigation and water management
- livestock management
- inventory and inputs
- equipment and machinery
- labour and employee management
- pest and disease management
- weather monitoring
- harvest management
- sales and market management
- financial management
- supplier and procurement management
- storage and post-harvest management
- dashboard and analytics
- notifications and alerts
- security and user management

## Suggested team workflow

- Create one issue per module or feature slice.
- Work in feature branches named `feature/<module-name>`.
- Keep backend API changes and frontend UI changes aligned through the API contract in `backend/public/index.php`.
- Use `docs/module-map.md` to decide what each teammate owns.
- Update `docs/assignment-scope.md` when the assignment brief changes or the group agrees on a narrower MVP.

## Project layout

```text
.
|- backend/
|  |- public/
|  |- src/
|  `- storage/
|- frontend/
|  |- src/
|  `- index.html
|- database/
|- docs/
`- infra/
```

## Notes

- The backend is intentionally framework-light and uses plain PHP.
- The Docker stack is designed for local collaboration and can be extended later with Composer, migrations, auth, and tests.
- The frontend is a static starter so the team can begin UI work before a framework decision is made.

