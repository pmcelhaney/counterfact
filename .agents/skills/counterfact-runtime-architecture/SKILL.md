---
name: counterfact-runtime-architecture
description: >
  Safely change Counterfact runtime/server internals while preserving module
  boundaries, hot reload behavior, and backward compatibility guarantees.
applyTo:
  - "packages/counterfact/src/app.ts"
  - "packages/counterfact/src/api-runner.ts"
  - "packages/runtime/src/server/**/*.ts"
  - "packages/counterfact/src/util/**/*.ts"
  - "packages/runtime/test/server/**/*.test.ts"
  - "packages/counterfact/test/app.test.ts"
  - "packages/repl/src/**/*.ts"
  - "packages/repl/test/**/*.test.ts"
---

# Counterfact Runtime Architecture Skill

## When to use this skill

Use this skill when changing runtime orchestration, server dispatch flow, module loading/hot reload, or context/registry behavior.

## Files to inspect first

- `packages/counterfact/src/app.ts`
- `packages/counterfact/src/api-runner.ts`
- `packages/repl/src/repl.ts`
- `packages/runtime/src/server/dispatcher.ts`
- `packages/runtime/src/server/module-loader.ts`
- `packages/runtime/src/server/web-server/create-koa-app.ts`
- `packages/counterfact/docs/reference.md` (architecture + runtime behavior)

## Existing conventions to follow

- Keep orchestration in `app.ts` / `ApiRunner`; avoid leaking server details into generator modules.
- Keep subsystems separated (`registry`, `context-registry`, `module-loader`, `dispatcher`) and connected through explicit constructor interfaces.
- Preserve hot-reload expectations: route/module changes should apply without restart and context should survive reloads.
- Prefer graceful degradation with actionable errors (see `docs/development/design-principles.md`).

## Common mistakes to avoid

- Coupling generator concerns into `packages/runtime/src/server/*` code paths.
- Breaking prefix/group/version routing derivation in `app.ts`.
- Introducing restart-only behavior for changes currently handled by watch/reload paths.
- Changing response defaults/content negotiation semantics unintentionally in `dispatcher` or Koa middleware.

## How to validate the change

- Run: `yarn lint`, `yarn build`, `yarn test`. The root test command uses the shared Jest configuration across application, runtime, REPL, generator, client, and OpenAPI test roots. Use `yarn test:runtime` or `yarn test:repl` to select those boundaries for focused runs.
- Run focused runtime tests first (for touched areas), e.g. `packages/runtime/test/server/dispatcher.test.ts`, `packages/runtime/test/server/module-loader.test.ts`, `packages/counterfact/test/app.test.ts`.
- Manually sanity-check startup + runtime flow with `yarn go:example` when behavior changes.

## Explicit reset versus hot reload

- Keep reset reconstruction distinct from hot reload's state-preserving merge.
  Retain loaded constructors/source route definitions; reconstruct stores before
  contexts and resolve context dependencies on demand, detecting cycles.
- Gate new HTTP requests before draining accepted handlers and response streams.
  A disconnected response is not producer completion: await body stream cleanup
  before releasing the barrier. Hold watcher updates during reconstruction and
  startup; keep failed resets
  unavailable until a later reset succeeds. Never close/rebind the listener.
- Track state availability independently from shutdown phase so overlapping stop
  cannot expose pending or failed reconstruction. Resolve scenario builder ports
  from the bound listener, including builders created before ephemeral binding.
- Contexts and stores change identity on reset. Refresh built-in REPL references
  and require consumers to reacquire live objects; registry handles stay stable.
- Share scenario path resolution between programmatic and REPL entrypoints, and
  preserve one startup per group in declaration order across versioned runners.
- Verify lifecycle changes with real HTTP mutation/restoration, same-listener
  checks, async barriers, concurrent calls, failure recovery, and shutdown.
