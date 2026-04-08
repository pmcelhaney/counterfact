# ADR 001: .apply Command Design — Minimalist Function Injection

## Status

Accepted

## Context

Counterfact's REPL lets developers interact with the running mock server from the terminal. A common need is to transition the server into a specific state (e.g. "all pets sold", "service unavailable") in a reproducible, shareable way. Today, operators must manually call REPL commands one by one; there is no mechanism to save and replay a named scenario.

The `.apply` command is proposed to address this: given a path argument, it loads and executes a user-authored script that mutates REPL context and routes, then reports what changed.

Three designs were proposed as working documents in `.github/issue-proposals/`:

- `apply-approach-1-function-injection.md` — plain TypeScript named function exports, no framework coupling
- `apply-approach-2-scenario-class-lifecycle.md` — a `Scenario` class interface with `setup()` / `teardown()` lifecycle hooks and a `dependencies` declaration
- `apply-approach-3-proxy-based-tracking.md` — transparent reactive proxies that intercept all mutations and produce an automatic structured diff

### Key constraints

- Counterfact users are TypeScript developers who prefer writing ordinary code over learning framework-specific APIs.
- The initial implementation must be straightforward to ship, test, and extend without committing to a heavy abstraction layer.
- The REPL already provides `context` and `routes` as live objects; any solution must integrate cleanly with those.
- TypeScript support is first-class via the existing transpiler.

## Decision

**Solution 1 (Minimalist Function Injection) is selected.**

An apply script is a TypeScript file with one or more named function exports. When `.apply <path>` is run, Counterfact splits the argument on `/`, uses the last segment as the function name and the rest as the file path (relative to `<basePath>/repl/`), dynamically imports the module, and calls the named function with a live `ApplyContext` (`$`) object:

```ts
// repl/sold-pets.ts
import type { ApplyContext } from "counterfact";

export function soldPets($: ApplyContext) {
  $.context.petService.reset();
  $.context.petService.addPet({ id: 1, status: "sold" });

  $.routes.getSoldPets = $.route("/pet/findByStatus").method("get").query({ status: "sold" });
}
```

`ApplyContext` exposes `{ context, loadContext, routes, route }`. After the function returns, Counterfact diffs the `routes` object and prints a summary of what was added or removed.

Solution 1 was chosen because it introduces the smallest possible API surface, imposes no structural requirements on script authors, and integrates naturally with TypeScript `import` for composability. It is the right foundation to build on before adding lifecycle or tracking features.

## Options

### Solution 1: Minimalist Function Injection (selected)

Scripts export named functions that receive `$: ApplyContext`. Counterfact resolves the file/function from the path argument and calls the function directly. Route changes are diffed and reported; context changes are not automatically tracked.

**Why chosen:** Maximum simplicity. No new abstractions, no required boilerplate. Easy to implement, test, and understand. Composability via normal `import`.

### Solution 2: Scenario Class with Lifecycle Hooks

Scripts export a named class that implements a `Scenario` interface with `setup()` and optional `teardown()` methods. Counterfact instantiates the class, calls `setup()`, and tracks applied instances in a map for later `.unapply`. A static `dependencies` array enables ordered composition.

**Why not chosen:** Class syntax and lifecycle coupling add complexity that is not justified until the need for teardown and dependency ordering is proven in practice. These concerns can be layered on top of Solution 1 once the basic command exists.

### Solution 3: Reactive Proxy-Based Change Tracking

Identical surface syntax to Solution 1, but Counterfact wraps `context` and `routes` in transparent `Proxy` objects before calling the function. All mutations are intercepted, logged, and printed as a structured diff automatically.

**Why not chosen:** The proxy layer adds significant runtime complexity and a class of subtle edge cases (prototype method calls, deeply nested mutations, proxy-obscured stack traces). The automatic diff is appealing but is a refinement that can be added after Solution 1 is stable, without changing the script-author API.

## Consequences

### What this enables

- Developers can save named scenarios as TypeScript files and replay them from the REPL.
- Scripts are ordinary TypeScript modules; they can import each other, use type-checking, and leverage the existing toolchain.
- The feature ships quickly without a large API commitment.

### Trade-offs accepted

- Context changes are not automatically tracked; script authors must document or annotate context mutations manually.
- There is no built-in teardown mechanism; reverting a scenario requires writing and calling a separate function.
- Dependency ordering between scenarios is the script author's responsibility via normal `import`.

### Risks and downsides

- Without lifecycle hooks, accumulated state across many `.apply` calls may be difficult to reason about.
- If teardown proves to be a common need, adding it later will require extending the API in a backward-compatible way.
- Proxy-based auto-diffing (Solution 3) remains attractive for DX; deferring it means script authors will need to be disciplined about documenting context changes in the short term.

### Follow-up work

- Evaluate whether `teardown` support (from Solution 2) is needed and, if so, define a clean extension point.
- Explore adding proxy-based context diffing (from Solution 3) as an opt-in enhancement once the core command is stable.
- Define `ApplyContext` as a public exported type in `counterfact-types/`.

## Advice

- **Apply this decision** whenever a new scenario management capability is considered for the REPL. Start with a named function in a `.ts` file; reach for classes or proxy wrappers only when a concrete need for lifecycle or auto-tracking is demonstrated. (Copilot/Claude)
- **Revisit this decision** if the lack of teardown creates significant friction for users who need to reset state cleanly, or if the absence of automatic context diffing makes scripts hard to audit. (Copilot/Claude)
- **Prefer Solution 2 or 3** when: (a) scenarios need deterministic cleanup, (b) dependency ordering between scenarios must be enforced automatically, or (c) context mutation tracking is required for auditing or debugging. (Copilot/Claude)
- **Rule of thumb:** keep scripts as plain TypeScript. If you find yourself writing setup/teardown boilerplate repeatedly, that is the signal to revisit lifecycle support. If you find yourself commenting every context change for reviewers, that is the signal to revisit proxy-based diffing. (Copilot/Claude)
- **A natural extension point is the return value of the function** (currently `void`). It could be an optional string used to summarize the changes made by the script. It could also return an object containing a `teardown()` function, providing a lightweight path to lifecycle support without requiring a full class interface. (@pmcelhaney)
