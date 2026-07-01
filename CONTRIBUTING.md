# Contributing to TechBridge Institute

## Branching Strategy

### Main Branch

- **`main` is production.** It must always be in a deployable state.
- No direct commits — all changes flow through pull requests.
- Branch protection enforced: build must pass, no force pushes, no deletions.
- Every merge to main triggers an automatic production deployment.

### Feature Branches

Create a branch from `main` for every feature, fix, or change:

```
git checkout main
git pull origin main
git checkout -b feature/contact-page
```

**Naming conventions:**

| Prefix | Use for | Example |
|---|---|---|
| `feature/` | New features | `feature/lms-integration` |
| `bugfix/` | Bug fixes | `bugfix/enrollment-count` |
| `hotfix/` | Urgent production fixes | `hotfix/login-crash` |
| `chore/` | Config, CI, docs, refactoring | `chore/update-deps` |

### Pull Request Workflow

1. Push your feature branch to GitHub
2. Open a PR targeting `main`
3. CI automatically:
   - Builds the app
   - Deploys to the **staging** slot for testing
4. Review and test on staging
5. Merge the PR — this triggers **production** deployment

```
feature/xyz ──push──▶ PR ──build + staging deploy──▶ review ──merge──▶ main ──▶ Production
```

### Deployment Flow

| Trigger | Environment | URL |
|---|---|---|
| PR opened/updated | Staging | `techbridge-staging-*.azurewebsites.net` |
| PR merged to main | Production | `techbridge-*.azurewebsites.net` |

### Release Tags

Tag production releases with semantic versions:

```
git tag -a v1.1.0 -m "Contact page, test suite, branching strategy"
git push origin v1.1.0
```

**Version format:** `vMAJOR.MINOR.PATCH`
- **MAJOR** — breaking changes or major feature sets
- **MINOR** — new features, backwards compatible
- **PATCH** — bug fixes

### Hotfixes

For urgent production issues:

1. Branch from `main`: `git checkout -b hotfix/fix-description`
2. Fix the issue
3. Open PR, verify on staging
4. Merge to `main` — deploys to production immediately
5. Tag with a patch version: `v1.1.1`

## Issue Management

All work is tracked in GitHub Issues using the following hierarchy:

- **[Epic]** — large business objectives spanning multiple features
- **[User Story]** — user-facing behavior: *"As a [user], I want [goal] so that [value]"*
- **[Task]** — technical implementation step
- **[Bug]** — defect at any level

Issues follow a standard template with: User Story, Acceptance Criteria, Definition of Done, Dependencies, and Technical Notes.

## Code Quality

- Run `npm test` before pushing
- Build must pass (`npm run build`)
- Use `/test` to run the automated test suite with GitHub issue management
