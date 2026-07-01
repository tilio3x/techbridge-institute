---
name: docs
description: Auto-update project documentation after code changes
---

# Documentation Update Skill

When invoked with `/docs`, review recent code changes and update the project documentation in `docs/`.

## Trigger

Run after commits that change:
- `server/index.js` — update `docs/api-reference.md` and `docs/architecture.md`
- `src/App.jsx` — update `docs/frontend.md` and `docs/architecture.md`
- `scripts/*.sql` — update `docs/database.md`
- `.github/workflows/*` — update `docs/deployment.md`
- `package.json` or `vite.config.js` — update `docs/architecture.md`

## Steps

1. Run `git diff HEAD~1 --name-only` to identify changed files since the last commit
2. For each changed area, read the updated source file(s) to get current state
3. Update the relevant documentation file(s) in `docs/`:
   - **`docs/architecture.md`** — System architecture, tech stack, Mermaid diagrams
   - **`docs/api-reference.md`** — All API endpoints, request/response shapes, email templates
   - **`docs/database.md`** — Table schemas, ERD diagram, migrations, indexes
   - **`docs/frontend.md`** — Component tree, views, auth flow, state management
   - **`docs/deployment.md`** — CI/CD pipeline, environment variables, infrastructure
4. Ensure Mermaid diagrams accurately reflect the current codebase
5. Stage and commit the documentation changes with message: `docs: update documentation for [changed area]`

## Usage

```
/docs              — Auto-detect changes and update all affected docs
/docs api          — Force update API reference only
/docs database     — Force update database schema only
/docs frontend     — Force update frontend architecture only
/docs deployment   — Force update deployment docs only
/docs all          — Force full documentation refresh
```

## Rules

- Keep documentation factual — describe what IS, not what SHOULD BE
- Update Mermaid diagrams when adding/removing components, endpoints, or tables
- Do not remove documentation for features that still exist in code
- Add new sections when new major features are introduced
- Keep the same formatting style as existing docs
