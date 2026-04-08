# Copilot Instructions for Counterfact

## REQUIRED: Pull Request Behavior

When creating or updating a pull request, you MUST:

1. Use the existing PR template.
2. Replace all placeholder comments (`<!-- ... -->`) with real content.
3. Ensure the PR description includes a section exactly titled:

   ## Manual acceptance tests

4. Under that section, include 3–6 unchecked checkboxes.

Each item must use this format:

- [ ] description of behavior

### Requirements

- Each checkbox must describe an observable behavior (not implementation details)
- Include:
  - the main success path
  - at least one edge case
  - at least one regression/backward compatibility check if applicable
- Do NOT check the boxes — they are for the human reviewer
- Do NOT describe implementation tasks (e.g., "refactored code", "updated types")

### Example

- [ ] `GET /hello/{name}` returns 200 with expected response body
- [ ] Invalid example name returns 500
- [ ] Response includes `x-test` header when defined
- [ ] Existing routes without examples behave unchanged

### Exception: Design PRs

When the goal of the **PR** is to **create more issues rather than write code** (e.g., proposing issue files under `.github/issue-proposals/`), treat the PR as a **design PR**:

1. Add the `design` label to the PR.
2. Do **not** include a "## Manual acceptance tests" section — omit it entirely.
3. The CI check for manual acceptance tests will automatically pass for PRs with the `design` label.

## Test-driven workflow

When implementing a change, work in a test-first or test-guided way whenever practical.

### Default workflow

1. Understand the requested behavior before changing code.
2. Identify the smallest observable behavior that proves the change works.
3. Add or update automated tests for that behavior first.
4. Run the relevant tests and confirm they fail for the expected reason when feasible.
5. Implement the smallest code change needed to make the tests pass.
6. Refactor only after the tests are green.
7. Run all relevant tests again before finishing.

### Expectations

- Prefer adding tests at the level that best captures user-visible behavior.
- Do not change tests merely to accommodate broken behavior unless the requested behavior has changed.
- Do not remove tests without explaining why.
- Avoid over-mocking. Prefer realistic behavior and real integration boundaries where practical.
- Keep tests readable. A test should make it obvious what behavior is expected.
- Cover at least:
  - the main success path
  - one meaningful edge case
  - one regression risk when applicable

### When to add tests

Add or update tests for:
- bug fixes
- new features
- refactors that could change behavior
- generated code, when generation behavior is being changed
- any change that affects external contracts, APIs, schemas, or CLI behavior

### When tests are hard to add

If a test is difficult to write:
1. Do not skip testing silently.
2. Explain why the code is hard to test.
3. Improve the design if possible to make testing easier.
4. If automated coverage is still impractical, provide clear manual verification steps.

### Definition of done

A change is not complete until:
- the relevant tests exist
- the relevant tests pass
- the implementation matches the requested behavior
- manual verification steps are included when needed

### Decision rule

When choosing between:
- writing more production code
- tightening tests
- simplifying design

prefer the option that improves feedback quality and reduces ambiguity.

## Required PR Checklist

- Every PR must pass CI: lint (ESLint), type check (`tsc --noEmit`), unit tests, black-box tests, and type tests.
- Run `yarn lint:fix` before each commit to auto-fix linting issues, then `yarn lint` to confirm no remaining errors.
- Include a changeset (`npx changeset`) for any user-facing change.
- Keep commits focused; prefer multiple small commits over one large one.
- Do not commit build artifacts (`dist/`, `out/`, `coverage/`) — they are in `.gitignore`.

## Context

Counterfact is a TypeScript-based mock server generator that transforms OpenAPI/Swagger specifications into live, stateful mock APIs with hot reload, a terminal REPL, and a built-in Swagger UI. Developers run it with a single command and receive fully typed route-handler files they can edit while the server is running.

```bash
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

## Repository Structure

```
src/
  app.ts                      # Main entry point; orchestrates generation, server startup, and REPL
  server/                     # Koa-based HTTP server, dispatcher, registry, hot-reload logic
  typescript-generator/       # Parses OpenAPI specs and emits TypeScript route/type files
  counterfact-types/          # Public API types exposed to route-handler authors
  repl/                       # Interactive terminal for inspecting/modifying server state at runtime
  migrate/                    # Helpers for updating existing route files when the spec changes
  client/                     # Handlebars HTML templates for the built-in dashboard/docs pages
  util/                       # Shared utility functions
bin/
  counterfact.js              # CLI entry point (commander-based)
test/                         # Jest unit tests
test-black-box/               # Python black-box integration tests (pytest)
templates/                    # Scaffold templates used during code generation
```

## Essential Commands

| Task                          | Command                          |
| ----------------------------- | -------------------------------- |
| Install dependencies          | `yarn install --frozen-lockfile` |
| Build                         | `yarn build`                     |
| Unit tests                    | `yarn test`                      |
| Black-box (integration) tests | `yarn test:black-box`            |
| TypeScript type tests         | `yarn build && yarn test:tsd`    |
| Lint (check)                  | `yarn lint`                      |
| Lint (auto-fix)               | `yarn lint:fix`                  |
| Run against Petstore          | `yarn go:petstore`               |

Always run `yarn lint:fix` before committing to automatically fix linting issues, then run `yarn test` to verify nothing is broken. Run `yarn lint` before opening a PR to confirm no remaining errors. Black-box tests require a build (`yarn build`) and Python 3 with pytest and requests installed (`pip install -r test-black-box/requirements.txt`); run them when touching server startup or CLI behaviour.

## Proposing New GitHub Issues

When planning work that requires new GitHub issues, follow the conventions in:

```
.github/instructions/issue-proposals.instructions.md
```

Key rules:

- **Never** create GitHub issues directly via the API, browser automation, or any other means.
- **Always** propose new issues as Markdown files under `.github/issue-proposals/`.
- Use YAML front matter for metadata (`title`, `parentIssue`, `labels`, `assignees`, `milestone`).
- Include `parentIssue` in front matter whenever you know the parent issue number.
- Write clear issue bodies with a summary, context/motivation, and acceptance criteria.

Proposal files are reviewed in a pull request and converted into real issues automatically on merge.


