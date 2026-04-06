# Counterfact Architecture Report Card

**Project**: `counterfact` v2.5.1  
**Type**: OpenAPI → Mock API Server Generator  
**Language**: TypeScript 6 / Node.js ≥ 22  
**Reviewed**: April 2026

---

## Overall Grade: A−

Counterfact is a well-engineered, production-ready project with a clear architecture, strong typing, and sophisticated runtime features. The codebase demonstrates thoughtful separation of concerns, modern tooling, and real attention to developer experience. Minor gaps in test distribution and a few areas of incidental complexity keep it just short of top marks.

---

## Module Grades

### `src/app.ts` — Application Orchestrator · **A**

The top-level factory function wires every subsystem together and returns a clean `{ start, stop }` interface. It reads well as a guided tour of the whole system. Lifecycle management (generate → transpile → load → serve) is explicit and easy to follow. The only nit is that `app.ts` is also the entry point for MSW handler creation, which is a mildly different concern.

### `src/server/` — Server Infrastructure · **A−**

| File | Responsibility | Notes |
|------|----------------|-------|
| `registry.ts` | Route tree, middleware chain | Clean tree-based matching; recursive middleware composition is elegant |
| `module-tree.ts` | N-ary path hierarchy | Detects ambiguous wildcards at construction time — good defensive design |
| `dispatcher.ts` | Request routing & handler invocation | Does a lot; could benefit from extracting content-negotiation into a helper |
| `context-registry.ts` | Per-route stateful context | Path-hierarchy inheritance with deep cloning is a nice design |
| `transpiler.ts` | `.ts` → `.cjs` compilation | Extends `EventTarget` consistently with the rest of the event model |
| `module-loader.ts` | Dynamic module import with dep graph | Largest file (~350 lines); Windows path-escaping is scattered here |
| `koa-middleware.ts` | HTTP middleware chain entry | CORS, auth, proxy delegation, and header filtering all in one place; could split proxy logic out |
| `response-builder.ts` | Fluent response construction | Builder pattern used well; JSON Schema Faker integration transparent to caller |
| `admin-api-middleware.ts` | Internal REST API | Sensible auth model (loopback-only by default, token-gated when exposed) |
| `create-koa-app.ts` | Koa stack assembly | Middleware order is well-documented in comments |

**Strength**: The recursive middleware chain walking up the path tree (`/users/123 → /users → /`) is a creative and effective pattern.  
**Concern**: `module-loader.ts` has grown large enough that extracting `FileDiscovery` and `MiddlewareDetector` responsibilities would improve readability.

### `src/typescript-generator/` — Code Generation · **B+**

| File | Responsibility |
|------|----------------|
| `generate.ts` | Top-level generation pipeline |
| `specification.ts` | OpenAPI document DOM with lazy `$ref` resolution |
| `requirement.ts` | Spec fragment / pointer navigation |
| `coder.ts` | Abstract visitor base with name-collision avoidance |
| `operation-coder.ts` | Route handler file generation |
| `operation-type-coder.ts` | TypeScript type file generation |
| `schema-type-coder.ts` | JSON Schema → TypeScript interface |
| `repository.ts` | File-write orchestration |
| `script.ts` | Per-file import/export accumulator |
| `prune.ts` | Orphan file cleanup |

The visitor-style `Coder` hierarchy cleanly maps each OpenAPI node type to a code-generation concern, and name-collision avoidance via generator functions (`name`, `name1`, `name2`, …) is robust.

The generator **does** have unit tests (`test/typescript-generator/`), with snapshot coverage of generated output — a good signal. The `Specification` class's caching of requirement objects adds a meaningful performance win for large specs.

**Concern**: Error propagation from malformed specs is thin — a bad `$ref` or missing `responses` block produces a confusing stack trace rather than a user-friendly message pointing at the offending spec line.

### `src/repl/` — Interactive Terminal · **B**

The REPL correctly extends Node's native `repl` module rather than reinventing it. Auto-completion of route paths from the registry is a practical touch. `RawHttpClient` is simple and does its job.

The REPL currently provides a text-only interface with five commands. There is room to grow (history search, richer formatting, interactive proxy config), but the existing surface is usable and well-scoped.

**Concern**: Only 2 test files cover the REPL, and one is integration-level. The `raw-http-client.ts` logic is not independently unit-tested.

### `src/counterfact-types/` — Public Type Definitions · **A**

The generated type surface is the project's most user-visible API and it is well-crafted. Conditional types (`IfHasKey`, `NeverIfEmpty`, `OmitAll`) prevent impossible states from being expressible. The `ResponseBuilder` generic accurately constrains callers to only the status codes and body shapes their OpenAPI spec declares.

Type tests (`*.test-d.ts` via `tsd`) confirm the types behave correctly at compile time — this is the right approach for a library that ships types as a primary deliverable.

### `src/migrate/` — Legacy Migration Utilities · **B+**

Two small, focused scripts handle the two known migration scenarios (`paths/` → `routes/`, `HTTP_GET` → operationId names). Code is straightforward. Test coverage is adequate for the narrow scope.

### `src/client/` — Frontend Dashboard · **C+**

The Handlebars-based dashboard (`index.html.hbs`) openly acknowledges its rough state in a comment at line 1. It functions, but the code is difficult to maintain. It renders server-side and ships no build step, which is pragmatic for an internal tool — but the single-file HTML+CSS+JS approach will be hard to extend.

The Swagger UI and RapiDoc integrations are thin wrappers and work fine.

**Recommendation**: Extract the JavaScript in `index.html.hbs` into a proper module (even a single vanilla JS file) to make it testable and reviewable.

### `src/util/` — Shared Utilities · **A−**

Four small, purpose-built helpers with clear names. `wait-for-event.ts` (promise wrapper for `EventTarget`) is useful and used consistently. `windows-escape.ts` centralises the platform-specific logic, though some call sites in `module-loader.ts` still perform ad-hoc escaping in addition to calling this helper.

### `bin/counterfact.js` — CLI Entry Point · **A−**

Commander is used idiomatically. The startup sequence (check Node version → run migrations → generate → serve → REPL) is linear and easy to follow. The async update check avoids blocking startup. Tagline rotation on welcome is a nice touch.

**Concern**: There is no machine-readable exit code for specific failure modes (bad spec, port in use), which makes it harder to use in CI pipelines that want to distinguish failure causes.

---

## Code Quality

### TypeScript · **A**

`tsconfig.json` enables `strict: true` and `noUncheckedIndexedAccess: true` — the highest practical strictness level. ESM modules are used throughout `src/`, with CommonJS interop handled explicitly at the boundary (`determine-module-kind.ts`, `.cjs` output). The generated types for route handlers are accurate end-to-end from spec to editor autocomplete.

### Linting · **A**

ESLint is configured with 15 plugins covering TypeScript semantics, imports, security, promises, regexes, Node.js best practices, and formatting (Prettier). Kebab-case filenames are enforced. Circular dependencies are detected. The `^_` prefix convention for intentionally unused parameters is documented in the config.

### Testing · **B+**

| Area | Test files | Notes |
|------|-----------|-------|
| `server/` | 18 | Good unit coverage of routing, registry, dispatcher |
| `typescript-generator/` | 15 | Snapshot-based; covers most coders |
| `repl/` | 2 | Light; `raw-http-client` uncovered |
| `migrate/` | 1 | Adequate for scope |
| Black-box | Python pytest suite | CLI + HTTP end-to-end |
| Type tests | `*.test-d.ts` via `tsd` | Verifies public type contracts |

Coverage thresholds (77% lines/statements, 80% branches/functions) are enforced and enforced in CI. The combination of unit, integration (black-box), and type tests is mature.

**Concern**: Snapshot tests in `test/typescript-generator/__snapshots__/` provide wide coverage but are brittle to whitespace/formatting changes. Supplementing with a few assertion-based tests for critical output structures would improve confidence.

### CI/CD · **A**

The GitHub Actions pipeline (`ci.yaml`) runs on both Ubuntu and Windows, covering ESLint, `tsc --noEmit`, Jest (unit), pytest (black-box), and `tsd` (type tests). CodeQL security scanning runs on schedule and on PRs. Changesets automates versioning and npm publishing. Renovate keeps dependencies up to date.

One minor gap: the pipeline runs `yarn eslint` only on Ubuntu (the `if: matrix.os != 'windows-latest'` condition). If a lint failure is Windows-only, it would not be caught here.

---

## Architecture Patterns

| Pattern | Where Used | Quality |
|---------|-----------|---------|
| Factory | `counterfact()`, `createKoaApp()` | ✅ Clean composition |
| Visitor | `Coder` hierarchy in code generator | ✅ Well-structured |
| Observer (`EventTarget`) | `Transpiler`, `ModuleLoader`, `CodeGenerator` | ✅ Consistent |
| Builder | `ResponseBuilder` | ✅ Fluent, type-safe |
| Registry | `Registry`, `ContextRegistry` | ✅ Clear ownership |
| Chain of Responsibility | Koa middleware, path-level middleware | ✅ Standard + custom extension |
| Strategy | `Dispatcher` content negotiation | ✅ Readable |
| Repository | `repository.ts` (code gen) | ✅ Separates write concerns |

No antipatterns were observed. The codebase avoids god objects, has no circular dependencies (enforced by ESLint), and follows a consistent event-driven style for async boundaries.

---

## Strengths

1. **End-to-end type safety.** The flow from OpenAPI spec → generated TypeScript types → route handler signatures means a developer working on a mock server gets full IDE autocomplete and compile-time errors when their handler doesn't match the spec. This is the project's defining feature and is executed well.

2. **Smart hot reload.** The three-stage watch pipeline (spec → `.ts` → `.cjs` → module registry) combined with a static dependency graph means only the files that actually need reloading are reloaded. This is non-trivial and works correctly.

3. **Stateful context hierarchy.** The `ContextRegistry` with path-prefix inheritance lets a developer build stateful mock workflows (e.g., POST creates a resource that GET can retrieve) without any special wiring. The design is clean and the implementation is thread-safe for single-process use.

4. **Strict TypeScript with strong enforcement.** `noUncheckedIndexedAccess` is one of the most commonly omitted strict settings; its presence here indicates serious commitment to type safety.

5. **Modern, minimal runtime dependencies.** Fifteen production dependencies is lean for a project of this scope. No jQuery, no lodash, no bloat.

6. **Cross-platform from the start.** Windows-specific path handling is addressed at multiple levels (dedicated utility, Windows matrix in CI, separate debug workflow). This is often an afterthought and is clearly not here.

---

## Areas for Improvement

### 1. Error messages from malformed specs (Priority: High)

A bad or partial OpenAPI document currently produces a JavaScript stack trace, not a user-facing message pointing at the problem. Given that users feed arbitrary specs to this tool, clear, actionable errors at this boundary would meaningfully reduce friction.

### 2. `module-loader.ts` size and focus (Priority: Medium)

At ~350 lines, `module-loader.ts` handles file discovery, module importing, context/middleware detection, dependency graph queries, and Windows path escaping. Splitting out `MiddlewareDetector` and `FileDiscovery` helpers would make each piece easier to test and reason about independently.

### 3. Dashboard maintainability (Priority: Medium)

The self-described "hideous" `index.html.hbs` works, but it is a maintenance liability. A minimal refactor — even just moving the inline JavaScript to a separate `.js` file served statically — would make it reviewable. A longer-term migration to a lightweight component framework would pay dividends.

### 4. REPL test coverage (Priority: Low)

`raw-http-client.ts` is untested. Adding unit tests for it and for the completer logic would round out coverage in this area.

### 5. No request validation against the spec (Priority: Low)

Counterfact validates responses (via generated types) but not incoming requests. Adding optional request validation would let developers catch client-side mistakes during development.

### 6. Snapshot test fragility (Priority: Low)

Snapshot tests in `test/typescript-generator/__snapshots__/` will break on any whitespace or formatting change to generated code. Where possible, supplementing with structural assertions (e.g., "the generated string exports a symbol named `GetUsersOperation`") would make these tests less brittle to incidental reformatting.

---

## Metrics

| Metric | Value |
|--------|-------|
| Source files (`.ts`) | 53 |
| Source lines (approx.) | ~6,200 |
| Test files | 42 |
| Runtime dependencies | 15 |
| Dev dependencies | 35+ |
| ESLint plugins | 15 |
| Coverage threshold (lines) | 77% |
| Coverage threshold (branches) | 80% |
| CI platforms | Ubuntu + Windows |
| Circular dependencies | 0 |
| TypeScript strict mode | ✅ |
| `noUncheckedIndexedAccess` | ✅ |

---

## Summary

Counterfact is a project that takes a genuinely hard problem — turning a flat OpenAPI document into a live, type-safe, hot-reloading mock server — and solves it with a coherent, well-layered architecture. The code is readable, the patterns are consistent, and the tooling is modern. The areas flagged above are genuine improvement opportunities, not warning signs.

| Area | Grade |
|------|-------|
| Module structure | A |
| TypeScript usage | A |
| Linting | A |
| Testing | B+ |
| CI/CD | A |
| Architecture patterns | A |
| Error handling | C+ |
| Frontend code | C+ |
| Documentation | B |
| **Overall** | **A−** |
