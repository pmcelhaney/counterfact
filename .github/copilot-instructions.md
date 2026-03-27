# Copilot Instructions for Counterfact

## Project Overview

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

## Technology Stack

- **Language:** TypeScript 5 + JavaScript ES modules (Node.js ≥ 17)
- **Server:** Koa 3 with koa-bodyparser and koa-proxies
- **Code generation:** Handlebars templates; `@apidevtools/json-schema-ref-parser` for spec parsing
- **Testing:** Jest 30 with `@swc/jest` transform; `supertest` for HTTP assertions; `pytest` + `requests` for black-box tests
- **Linting / formatting:** ESLint 9 (flat config in `eslint.config.cjs`) + Prettier 3
- **Build:** `tsc` + `copyfiles`; SWC transpiles route files at runtime
- **Package manager:** Yarn 1 (`yarn.lock` must be committed)
- **Versioning:** Changesets (`@changesets/cli`)

## Essential Commands

| Task | Command |
|---|---|
| Install dependencies | `yarn install --frozen-lockfile` |
| Build | `yarn build` |
| Unit tests | `yarn test` |
| Black-box (integration) tests | `yarn test:black-box` |
| TypeScript type tests | `yarn build && yarn test:tsd` |
| Lint | `yarn lint` |
| Run against Petstore | `yarn go:petstore` |

Always run `yarn test` after making code changes. Run `yarn lint` before opening a PR. Black-box tests require a build (`yarn build`) and Python 3 with pytest and requests installed (`pip install -r test-black-box/requirements.txt`); run them when touching server startup or CLI behaviour.

## Coding Conventions

### TypeScript vs JavaScript

- New files under `src/server/` and `src/repl/` should be **TypeScript** (`.ts`).
- Files under `src/typescript-generator/` are intentionally **JavaScript** (`.js`) because they generate code as strings and mixing generated-string manipulation with TypeScript generics adds noise without benefit.
- Keep new additions consistent with the language used by existing files in the same directory.

### ES Modules

The package is `"type": "module"`. All source files use ESM `import`/`export` syntax. The only CommonJS files are:
- `*.cjs` runtime shims under `src/server/` (for hot-reload cache busting)
- `eslint.config.cjs` and `jest.config.js` (tool config that must be CJS)

### Naming

- File names use **kebab-case** (e.g., `module-loader.ts`, `schema-type-coder.js`).
- Exported classes and types use **PascalCase**.
- Exported functions and variables use **camelCase**.

### Error Handling

Throw typed errors with descriptive messages. Do not swallow exceptions silently. Use `debug` (the npm package) for development-mode logging rather than `console.log`.

### Route Handler Shape

Generated and user-edited route handlers follow this signature (defined in `src/counterfact-types/index.ts`):

```typescript
import type { HTTP_GET } from "counterfact";

export const GET: HTTP_GET = ($) => {
  return $.response[200].json($.context.items);
};
```

The `$` parameter exposes `context`, `response`, `request`, `body`, `path`, and `query`. Keep generated handler files minimal and human-readable.

### Context Objects

State shared across routes is stored in per-path context objects managed by `ContextRegistry`. Route files import `context` via the `$` argument. Context is in-memory and resets on server restart.

## Testing Conventions

- Unit test files live in `test/` and are named `*.test.ts` or `*.test.js`.
- Type-definition tests live in `test/` and are named `*.test-d.ts` (checked by `tsd`).
- Black-box integration tests live in `test-black-box/` and are written in Python using `pytest`. They start counterfact as an external process and test it over HTTP, with no knowledge of internals.
- Use `supertest` for HTTP-level assertions against the Koa app in unit tests.
- Mock file-system operations with `using-temporary-files` (available as a dev dependency).
- Jest is configured with a 10-second timeout; increase per-test via `jest.setTimeout()` only when genuinely needed.
- Coverage thresholds: 77% lines/statements, 80% functions/branches. Do not lower these.

## Pull Request Guidelines

- Every PR must pass CI: lint (ESLint), type check (`tsc --noEmit`), unit tests, black-box tests, and type tests.
- Include a changeset (`npx changeset`) for any user-facing change.
- Keep commits focused; prefer multiple small commits over one large one.
- Do not commit build artifacts (`dist/`, `out/`, `coverage/`) — they are in `.gitignore`.

## Architecture Notes

- **Dispatcher** (`src/server/dispatcher.ts`) matches incoming URL paths to route handlers registered in **Registry** (`src/server/registry.ts`).
- **ModuleLoader** (`src/server/module-loader.ts`) dynamically imports route files, clears the module cache on changes, and triggers hot-reload without restarting the server.
- **Transpiler** (`src/server/transpiler.ts`) compiles `.ts` route files to `.cjs` using SWC at runtime so users can write TypeScript handlers without a separate build step.
- **CodeGenerator** (`src/typescript-generator/code-generator.ts`) watches the OpenAPI spec and regenerates route/type files when the spec changes.
- **Admin API** (`src/server/admin-api-middleware.ts`) exposes REST endpoints under `/_counterfact/api/` for inspecting and modifying server state programmatically (used by the Copilot REPL skill).
