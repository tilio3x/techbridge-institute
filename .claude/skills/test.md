# /test — Run tests, report findings, update GitHub

Run the project's test suite, analyze results, and automatically manage GitHub issues for any failures found.

## When to use

- User invokes `/test` to run all tests
- User invokes `/test smoke` to run only smoke tests
- User invokes `/test integration` to run only integration tests
- User invokes `/test security` to run only security tests
- User invokes `/test regression` to run only regression tests
- After completing a feature or fix, to verify nothing is broken

## Instructions

<command-name>test</command-name>

### Step 1 — Determine scope

Check the `args` value to decide which tests to run:
- No args or `all` → run all tests: `npm test`
- `smoke` → run only: `npx vitest run tests/api/smoke`
- `integration` → run only: `npx vitest run tests/api/integration`
- `security` → run only: `npx vitest run tests/api/security`
- `regression` → run only: `npx vitest run tests/api/regression`

### Step 2 — Run the tests

Run the selected test command via Bash. The tests require the API server to be running and connected to the database. If tests fail because the server isn't reachable:
1. Check if the server is running on port 3001
2. If not, inform the user: "The API server needs to be running for tests. Start it with `npm start` or set `TEST_BASE_URL` to point to the staging URL."

You can also run tests against the deployed staging environment:
```
TEST_BASE_URL=https://techbridge-staging-dcadfwggdsckfebs.spaincentral-01.azurewebsites.net npx vitest run
```

### Step 3 — Analyze results

Parse the test output and categorize results:
- **Passed** — tests that succeeded
- **Failed** — tests that failed (potential bugs)
- **Errors** — tests that errored (infrastructure/config issues)

### Step 4 — Report to user

Give a concise summary:
```
Tests: X passed, Y failed, Z errors
Duration: Ns
```

If all tests pass, report success and stop.

### Step 5 — Create GitHub issues for failures

For each unique failure, check if a matching open issue already exists (search by test name or error message). If not, create a new issue using the project's user story template:

```
gh issue create --title "[Bug] <descriptive title from test failure>" \
  --label "bug" \
  --milestone "v1.1 — Contact & Polish" \
  --body "## User Story
As a **developer**, I want <what failed> to work correctly so that <business impact>.

## Acceptance Criteria
- [ ] <the specific test assertion that failed> passes
- [ ] No regressions in related tests

## Definition of Done
- [ ] Fix implemented
- [ ] All tests passing
- [ ] Code review completed

## Dependencies
- Found by automated test: \`<test file>:<test name>\`

## Technical Notes
**Error:** \`<error message>\`
**Test file:** \`<file path>\`
**Stack trace:**
\`\`\`
<relevant stack trace>
\`\`\`"
```

Add the issue to the project board:
```
gh project item-add 1 --owner tilio3x --url <issue-url>
```

### Step 6 — Update existing bug issues

If a previously failing test now passes, check if there's an open bug issue for it and close it:
```
gh issue close <number> --comment "Test now passing. Verified by automated test run."
```

### Test types reference

| Type | What it checks | File |
|---|---|---|
| **Smoke** | All API endpoints return 200, basic request/response | `tests/api/smoke.test.js` |
| **Integration** | Cross-entity flows: enrollment→course, schedule→course, contact inquiry, instructor→course assignment, data consistency | `tests/api/integration.test.js` |
| **Security** | SQL injection, XSS, input validation | `tests/api/security.test.js` |
| **Regression** | Data integrity, response shape, relationships | `tests/api/regression.test.js` |
