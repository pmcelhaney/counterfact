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
  - a regression/backward compatibility check if applicable
- Do NOT check the boxes — they are for the human reviewer
- Do NOT describe implementation tasks (e.g., "refactored code", "updated types")

### Example

- [ ] `GET /hello/{name}` returns 200 with expected response body
- [ ] Invalid example name returns 500
- [ ] Response includes `x-test` header when defined
- [ ] Existing routes without examples behave unchanged

## Required PR Checklist

- Every PR must pass CI: lint (ESLint), type check (`tsc --noEmit`), unit tests, black-box tests, and type tests.
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
| Lint                          | `yarn lint`                      |
| Run against Petstore          | `yarn go:petstore`               |

Always run `yarn test` after making code changes. Run `yarn lint` before opening a PR. Black-box tests require a build (`yarn build`) and Python 3 with pytest and requests installed (`pip install -r test-black-box/requirements.txt`); run them when touching server startup or CLI behaviour.

## Coding Conventions

### TypeScript vs JavaScript

- New files under `src/server/` and `src/repl/` should be **TypeScript** (`.ts`).
- Files under `src/typescript-generator/` are intentionally **JavaScript** (`.js`) because they generate code as strings and mixing generated-string manipulation with TypeScript generics adds noise without benefit.
- Keep new additions consistent with the language used by existing files in the same directory.
