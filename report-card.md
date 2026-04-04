# Counterfact Architecture Report Card

> Reviewed: April 2026 · Version: 2.5.1

---

## Executive Summary

Counterfact is a TypeScript-based mock server generator that converts an OpenAPI/Swagger specification into a live, stateful, hot-reloading API. The codebase is well-structured, clearly modularised, and consistently typed. The architecture cleanly separates concerns: code generation, transpilation, module loading, request dispatch, and developer tooling each live in their own layer. Documentation at every level (package README, per-directory READMEs, inline diagrams) is exceptional for a project of this size.

The main areas for improvement are test coverage in a small number of critical paths, some accidental complexity in the module-loading pipeline, and a handful of configuration/type seams that could be tightened.

---

## Grades at a Glance

| Dimension | Grade |
|---|---|
| Separation of Concerns | A |
| Code Consistency | A− |
| TypeScript Usage | B+ |
| Testability & Test Coverage | B |
| Documentation | A |
| Dependency Management | B+ |
| Error Handling | B− |
| Security | B |
| Extensibility | B+ |
| Observability | B |

---

## 1. Separation of Concerns · A

**Strengths**

- The codebase is divided into seven coherent modules (`server/`, `typescript-generator/`, `repl/`, `migrate/`, `util/`, `client/`, `counterfact-types/`), each with a single, named responsibility.
- `app.ts` acts as an orchestrator, wiring together independently testable units (CodeGenerator, Transpiler, ModuleLoader, Registry, Dispatcher, KoaApp) without any module "reaching across" to another at the wrong abstraction level.
- The generator pipeline (Specification → Requirement → Coder → Script → Repository) enforces a clean data-flow direction; coders never know about the HTTP layer.
- The `Config` interface (`server/config.ts`) is a pure data object shared between layers, avoiding hidden global state.

**Minor issues**

- `app.ts` exposes both a `counterfact()` factory (for server mode) and `createMswHandlers()` (for MSW/Vitest Browser mode). These two concerns are subtly different and the shared `mswHandlers` map at module scope is a mutable singleton that could cause test-isolation problems.
- `module-loader.ts` imports `uncached-require.cjs` at the top level with a dynamic `await import(...)`, which ties ESM startup to a CJS side-effect. Extracting this into a factory parameter (as is done in tests via `ModuleLoaderClass`) would remove the coupling.

---

## 2. Code Consistency · A−

**Strengths**

- Naming is consistent: classes use PascalCase, files use kebab-case, and public class members use camelCase throughout.
- The `debug` package is used uniformly for diagnostic logging with namespaced channels (`counterfact:server:dispatcher`, etc.), making it easy to enable targeted tracing.
- ESLint configuration is extensive and well-tuned; `argsIgnorePattern: "^_"` is correctly used to allow unused parameters in abstract base class methods.

**Minor issues**

- A handful of `.js` extension references persist in some `typescript-generator/README.md` descriptions (e.g., `generate.js`, `specification.js`), which are out of date now that the directory is fully TypeScript.
- The `Stryker disable all` comment at the top of `transpiler.ts` suppresses mutation testing for the entire file, hiding potential quality gaps.
- `config.ts` exports `DUMMY_EXPORT_FOR_TEST_COVERAGE = 1`, a workaround artefact that should be removed once test coverage tooling supports type-only files.

---

## 3. TypeScript Usage · B+

**Strengths**

- The entire `src/` directory is TypeScript; the migration away from JavaScript is complete.
- The Coder hierarchy (abstract base → TypeCoder → concrete coders) correctly models the domain with a Template Method pattern and enforces contracts via TypeScript abstract methods.
- `counterfact-types/` exports a clean, narrow public API surface (`HttpResponseBuilder`, `HttpTool`, `OpenApiHeader`) that consumers depend on, avoiding any coupling to internal types.
- `types.test-d.ts` validates the public type surface with `tsd`, preventing accidental type regressions.

**Issues**

- Several `as any` casts appear in test helpers (e.g., `ctx as any` in `admin-api-middleware.test.ts`), which are acceptable in tests but indicate that the Koa context mock could be typed more precisely.
- `OpenApiDocument` in `dispatcher.ts` is defined as a local interface with optional fields rather than being derived from a community schema type. If the OpenAPI spec changes in breaking ways this definition would silently drift.
- The `mswHandlers` map in `app.ts` is typed as `MswHandlerMap` but is a module-level singleton; type narrowing does not prevent multi-instance pollution.

---

## 4. Testability & Test Coverage · B

**Strengths**

- Three complementary test layers are present: Jest unit tests (`test/`), black-box integration tests (`test-black-box/` via pytest + subprocess), and type tests (`tsd`).
- Nearly every public class has a matching `*.test.ts` file; the `typescript-generator/` tests in particular cover individual coders and snapshot-test generated output.
- `usingTemporaryFiles()` (from `using-temporary-files`) is used for disk-touching tests, keeping them hermetic.
- `jest-retries` is configured, acknowledging that file-system-dependent tests can be flaky on slow CI runners.

**Issues**

- `transpiler.ts` opts out of mutation testing entirely (`Stryker disable all`). The transpiler is a critical hot-reload path; its correctness should be verified.
- `transpiler-sketchy.test.ts` exists as a separate file, suggesting some tests are considered unreliable. Flaky tests that cannot be fixed should be removed rather than kept in a "sketchy" file.
- The `createMswHandlers` path in `app.ts` is difficult to test in isolation because it shares module-level state (`mswHandlers`) with `handleMswRequest`; a class-based design would enable isolated unit testing.
- Black-box tests require Python 3 and pytest, adding an out-of-ecosystem dependency that makes onboarding slightly harder.

---

## 5. Documentation · A

**Strengths**

- Every `src/` subdirectory has a `README.md` with a file-level table and architecture diagrams in ASCII art.
- The top-level `src/README.md` gives an accurate system-level diagram of the full data-flow.
- The `typescript-generator/README.md` contains a step-by-step walkthrough of the coder collaboration pattern, which is the hardest part of the codebase to understand.
- `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` are present and follow community standards.
- Inline comments in complex files (e.g., `admin-api-middleware.ts`) clearly mark logical sections.

**Minor issues**

- Some file descriptions in `typescript-generator/README.md` still reference `.js` extensions (e.g., `generate.js`, `specification.js`) after the TypeScript migration.
- The `bin/counterfact.js` entry point has no README or inline architecture overview despite containing several important startup behaviours (migration detection, update check, CLI option assembly).

---

## 6. Dependency Management · B+

**Strengths**

- Production dependencies are well-chosen: Koa (lightweight HTTP), Chokidar (file watching), SWC (fast transpilation), and `json-schema-faker` (smart fake data) are all maintained, widely used, and fit-for-purpose.
- The `resolutions` field in `package.json` documents two intentional overrides (`js-yaml`, `@typescript-eslint/utils`), preventing hidden transitive version conflicts.
- `patch-package` is used for only one targeted patch, indicating restraint.
- `renovate.json` is present for automated dependency updates.

**Issues**

- `fetch` v1.1.0 is listed as a production dependency alongside `node-fetch` v3.3.2. Both provide `fetch`; the older `fetch` package appears to be a historical artefact and should be removed.
- `lodash` is a production dependency but only `cloneDeep` is used (in `context-registry.ts`). A native `structuredClone` (available in Node ≥ 17, the minimum required version) would eliminate the dependency entirely.
- `prettier` is listed as a production dependency because the generator uses it to format emitted code at runtime. This is intentional but worth a comment, since it is unusual to have a formatter in production deps.

---

## 7. Error Handling · B−

**Strengths**

- The `Dispatcher` returns structured error responses (plain-text body, appropriate status codes) for missing routes, ambiguous wildcard matches, and proxy failures rather than letting exceptions propagate unhandled.
- `loadOpenApiDocument` in `app.ts` catches parse errors and returns `undefined`, allowing the caller to decide how to handle a missing spec.
- The admin API middleware wraps all handler logic in a `try/catch` and returns a consistent `AdminApiResponse` shape on error.

**Issues**

- Several `catch` blocks discard the error object entirely (bare `catch {}` or `catch { ... }` without logging). In `dispatcher.ts` and `module-loader.ts` these silent failures make production debugging significantly harder.
- The proxy error path in `koa-middleware.ts` logs to `console.error` rather than using the `debug` channel, breaking the uniform observability model.
- `createMswHandlers` in `app.ts` calls `await fs.readFile(config.openApiPath)` and discards the result before calling `loadOpenApiDocument`. If the file read fails, the error message will be confusing because the subsequent `loadOpenApiDocument` failure message references the path again without context.
- The `Transpiler` emits a `"failed"` event on compilation errors but does not surface the TypeScript diagnostic messages to the developer, making it hard to understand why hot-reload did not apply.

---

## 8. Security · B

**Strengths**

- The admin API middleware restricts access to loopback addresses (`127.0.0.1`, `::1`) and requires a Bearer token when `adminApiToken` is configured, preventing remote exploitation.
- The `adminApiToken` is redacted in debug logs (`[REDACTED]`), preventing accidental credential exposure.
- `eslint-plugin-security` is configured in the linting pipeline, providing automated SAST scanning.
- `jsonwebtoken` is used for JWT validation rather than manual base64 parsing.

**Issues**

- When `adminApiToken` is not configured, the admin API is accessible to any process on the loopback interface with no authentication. A warning at startup when the admin API is enabled without a token would reduce accidental exposure.
- The `page-middleware.ts` renders Handlebars templates that include route names and file paths. If an attacker could inject a malicious route name (unlikely in practice but theoretically possible), it could result in reflected output in the dashboard HTML. Handlebars escapes by default, but the dashboard template should be audited for `{{{ triple-stash }}}` unescaped expressions.
- The `response-builder.ts` uses `json-schema-faker` which calls `eval`-adjacent code paths under some schema configurations; this is an accepted tradeoff for a dev-only tool but should be documented.

---

## 9. Extensibility · B+

**Strengths**

- `_.middleware.ts` files allow users to inject custom Koa middleware into any route subtree without forking the codebase.
- The `Config` interface has a clear boundary; all runtime behaviour can be changed by passing a different config object.
- `EventTarget` is used by `CodeGenerator`, `Transpiler`, and `ModuleLoader`, making it easy to attach listeners without subclassing.
- The MSW integration (`createMswHandlers`) enables Counterfact to be used as a Vitest Browser mode handler, demonstrating that the core dispatch logic is decoupled from the HTTP transport.

**Issues**

- There is no public plugin API. Users who want to customise code generation (e.g., emit React Query hooks instead of plain route stubs) must fork the `typescript-generator/` directory. A documented extension point (e.g., a `Coder` override map) would enable an ecosystem of generator plugins.
- The `client/` templates are compiled into `dist/client/` at build time and cannot be overridden by users without forking. A `--template-dir` option would allow custom dashboards.

---

## 10. Observability · B

**Strengths**

- The `debug` package is used throughout with fine-grained namespaces (`counterfact:server:dispatcher`, `counterfact:typescript-generator:generate`, etc.), giving operators precise control over log verbosity.
- The admin API exposes a `/health` endpoint with uptime, port, and base path, enabling lightweight monitoring.
- The REPL provides live introspection of context state and route registrations at runtime.

**Issues**

- There is no structured logging (e.g., JSON lines). All diagnostic output goes through the unstructured `debug` channel or `console.*`, making it difficult to integrate with log aggregators.
- Hot-reload success/failure is not surfaced in the browser dashboard; a developer editing a route file has no way to know whether the reload succeeded without checking the terminal.
- There are no metrics (request counts, response times, error rates). For a mock server used in CI pipelines this is acceptable, but users running Counterfact as a longer-lived integration environment would benefit from basic counters.

---

## Summary of Recommended Actions

| Priority | Action | Status |
|---|---|---|
| High | Remove silent `catch {}` blocks; log errors through the `debug` channel | ✅ Done |
| High | Warn at startup when the admin API is enabled without a token | ✅ Done |
| Medium | Replace `lodash` (`cloneDeep`) with a native deep-clone (custom `cloneForCache` helper, avoids `structuredClone` limitation with functions) | ✅ Done |
| Medium | Remove or fix the `transpiler-sketchy.test.ts` flaky-test file | ✅ Done (unique test migrated to `transpiler.test.ts`; sketchy file deleted) |
| Medium | Fix stale `.js` extension references in `typescript-generator/README.md` | ✅ Done |
| Medium | Remove the redundant `fetch` v1 production dependency | ✅ Done |
| Low | Remove `DUMMY_EXPORT_FOR_TEST_COVERAGE` from `config.ts` | ✅ Done |
| Low | Surface TypeScript diagnostic messages from the `Transpiler` on compilation failure | ✅ Done |
| Low | Add a `--template-dir` option to allow custom dashboard templates | ⏭ Skipped (out of scope) |
| Low | Add a README or inline overview to `bin/counterfact.js` | ✅ Done |
