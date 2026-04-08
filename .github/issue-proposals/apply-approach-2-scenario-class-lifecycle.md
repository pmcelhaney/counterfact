---
title: ".apply Command Design (Approach 2): Scenario Class with Lifecycle Hooks"
parentIssue: 1596
labels:
  - enhancement
  - repl
  - design
assignees: []
milestone:
---

## Summary

Implement `.apply` using a `Scenario` class interface with explicit `setup()` and `teardown()` lifecycle hooks, plus optional `dependencies` declaration. Classes are exported by name — the last segment of the `.apply` path selects the named export, and Counterfact instantiates it automatically. This approach adds structure for scenarios that need cleanup and enables dependency-ordered composition.

---

## Design

### Script format

A scenario is a named class export that implements the `Scenario` interface:

```ts
// repl/sold-pets.ts
import type { Scenario, ApplyContext } from "counterfact";

export class soldPets implements Scenario {
  static dependencies = ["base"];

  setup($: ApplyContext): void {
    $.context.petService.addPet({ id: 1, status: "sold" });
    $.context.petService.addPet({ id: 2, status: "available" });

    $.routes.getSoldPets = $.route("/pet/findByStatus").method("get").query({ status: "sold" });
  }

  teardown($: ApplyContext): void {
    $.context.petService.removePet(1);
    $.context.petService.removePet(2);
    delete $.routes.getSoldPets;
  }
}
```

### The `Scenario` interface

```ts
export interface Scenario {
  /** Optional list of scenario names that must be applied first */
  static dependencies?: string[];

  /** Mutate the environment to activate this scenario */
  setup(ctx: ApplyContext): void | Promise<void>;

  /** Undo changes made by setup (optional) */
  teardown?(ctx: ApplyContext): void | Promise<void>;
}
```

> `ApplyContext` provides `{ context, loadContext, routes, route }` where `routes` is a plain object in the REPL execution context.

### Invocation

The same path/name convention as Approach 1 applies. The last segment selects the named export; everything before it is the file path:

```
.apply foo              # repl/index.ts  → new foo().setup($)
.apply foo/bar          # repl/foo.ts    → new bar().setup($)
.unapply foo/bar        # repl/foo.ts    → new bar().teardown($)
.apply base soldPets    # apply multiple scenarios in order
```

### Dependency resolution

When a scenario declares `static dependencies`, Counterfact automatically applies each dependency in order before applying the requested scenario. If a dependency is already applied (tracked by name), it is skipped.

```
⬣> .apply sold-pets/soldPets
# Counterfact first applies "base" (dependency), then "soldPets"
Applied base → soldPets

Routes added:
  getSoldPets
```

### Applied scenario tracking

Counterfact maintains a runtime stack of applied scenario names so that:

- `.unapply` can call `teardown()` on the most recent scenario
- Dependencies already in the stack are not re-applied
- `.apply` shows which scenarios are currently active

```
⬣> .apply status
Applied scenarios:
  base (no teardown)
  sold-pets
```

---

## Implementation sketch

1. Add `.apply` and `.unapply` dot-commands in `src/repl/repl.ts`.
2. Dynamically import the scenario class and resolve `dependencies` recursively.
3. Apply each dependency (if not already applied), then the requested scenario, by calling `setup()`.
4. Store applied scenario instances in a `Map<string, Scenario>` on the REPL context.
5. `.unapply` calls `teardown()` on the stored instance and removes it from the map.

---

## Trade-offs

| Aspect | Notes |
|---|---|
| **Simplicity** | More boilerplate than Approach 1; class syntax required |
| **Lifecycle support** | Explicit `teardown()` enables clean state resets |
| **Dependency composition** | Declarative dependency graph prevents accidental ordering mistakes |
| **Idempotence** | Applied scenario tracking prevents duplicate application |
| **Flexibility** | Class structure may feel heavy for simple one-off scripts |

---

## Acceptance criteria

- [ ] `.apply foo/bar` resolves `repl/foo.ts`, instantiates `bar`, and calls `setup($)`
- [ ] `.apply foo` resolves `repl/index.ts`, instantiates `foo`, and calls `setup($)`
- [ ] Static `dependencies` are applied automatically before the target scenario
- [ ] A dependency that is already applied is not re-applied
- [ ] `.unapply foo/bar` calls `teardown($)` on the stored `bar` instance
- [ ] The REPL tracks and displays the stack of currently applied scenarios
- [ ] Scenarios that do not declare `teardown()` are still valid and usable
- [ ] A meaningful error is shown when a dependency cycle is detected
- [ ] Existing REPL commands and behavior are unaffected
