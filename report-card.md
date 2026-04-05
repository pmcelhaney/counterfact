# Counterfact Architecture Report Card

Scope: Current repository state (codex/create-architecture-report-card branch), reviewing generator, runtime server, REPL/admin API, and client surfaces.

## System Overview
- CLI entry (`bin/counterfact.js`) assembles config with Commander, runs migrations, then calls `src/app.ts` to wire the generator, transpiler, module loader, dispatcher, Koa app, and optional REPL.
- Code generation (`src/typescript-generator/*`) dereferences the OpenAPI document, emits typed route/type files, prunes stale outputs, and watches the spec when it is local.
- Runtime server uses `Registry`/`ModuleTree` for routing, `Dispatcher` for request normalization/proxying, `ContextRegistry` for per-path state, and `create-koa-app.ts` to mount Swagger UI, RapiDoc, the API tester, and the admin API.
- Hot reload path: route/type files → TypeScript → `.cache` via `Transpiler` → `ModuleLoader` loads endpoints, middleware, and contexts; dependency graph reloads dependents on change.
- Developer surfaces: terminal REPL (`src/repl/repl.ts` + `RawHttpClient`), admin API with token/loopback guard, and browser UI templates under `src/client` served by `page-middleware.ts`.

## Grades
| Category | Grade | Rationale |
| --- | --- | --- |
| Architecture & modularity | B+ | Clear separation of generator, runtime, REPL, and client layers orchestrated from `src/app.ts`; chokidar-powered pipelines keep responsibilities focused, though config is spread across CLI flags and runtime defaults. |
| Runtime reliability | B | Module loader builds a dependency graph and replaces failing routes with 500 responders on load errors; dispatcher normalizes responses and detects ambiguous wildcards. Watchers still throw on unexpected import errors and there is minimal circuit breaking around user code. |
| Observability & operations | C | Debug logging only; no request IDs, metrics, tracing, or structured logs. Admin API health endpoint is shallow and there is no centralized error reporting or log level management. |
| Performance & scalability | B | Precompiling routes to `.cache` and reusing dereferenced specs keeps startup fast; in-memory registries and path matching are lightweight. Scalability story for very large specs is unclear (single process, chokidar watchers, no worker isolation). |
| Security & safety | C | Admin API enforces bearer token or loopback, but the runtime executes user routes unsandboxed, proxying can forward to arbitrary hosts, and numerous ESLint security warnings (non-literal fs/object injection) are tolerated. |
| Testing & quality | A- | Robust Jest suite (38 suites, ~87% statements) plus black-box and type tests; generator/runtime pieces are well covered. Linting uses security and Jest rules but leaves many warnings unaddressed. |
| Developer experience & docs | B+ | README, usage docs, and design principles are strong; generated scaffolding, Swagger/RapiDoc dashboards, and REPL help onboarding. Lacks an explicit architecture/runbook diagram and consolidated config reference. |

## Strengths
- Hot-reload pipeline is cohesive: generator → transpiler → module loader → registry keeps route code editable without restarts.
- Strong typing end-to-end: OpenAPI-driven types flow into dispatcher and response builders, reducing handler mistakes.
- Multiple control planes (REPL, admin API, browser tester, Swagger UI) make the tool approachable for rapid iteration.
- Resilience primitives exist: route load failures degrade to 500 responders instead of crashing; ambiguous routes are detected.
- Test coverage spans generator, runtime, and black-box flows; build step ensures distribution artifacts mirror source.

## Risks and Gaps
- Observability is minimal; production debugging would rely on ad-hoc `debug` logs with no correlation or metrics.
- Security posture relies on convention: many dynamic fs/object accesses remain flagged by lint; route code runs with full process privileges.
- Single-process, watcher-heavy model may struggle with very large specs or containerized deployments; no throttling or worker isolation.
- Config is dispersed (CLI parsing, defaults in code, environment variables for admin API); no central schema or validation layer.
- Client surfaces (Swagger UI, RapiDoc, API tester) and admin API share the runtime without rate limiting or auth beyond the admin token.

## Recommendations
1) Add a lightweight architecture/runbook doc describing the generator → transpiler → loader → dispatcher flow, main config knobs, and failure modes; include a diagram.
2) Introduce structured logging with request IDs and log levels, plus a simple health/status surface that reports watcher state, loaded routes, and proxy settings.
3) Harden security: address or explicitly suppress the recurring ESLint security warnings, document proxy safety expectations, and consider optional sandboxing/timeout guards for user route execution.
4) Centralize config parsing/validation (schema + defaults) so CLI/env/admin API share a single source of truth, reducing drift.
5) Plan for scale: benchmark large specs, and consider batching chokidar events, optional worker pools for response generation, or a mode that preloads without long-lived watchers when running in CI/containers.
