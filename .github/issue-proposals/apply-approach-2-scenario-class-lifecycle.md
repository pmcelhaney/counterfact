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

Implement `.apply` using a `Scenario` class interface with explicit `setup()` and `teardown()` lifecycle hooks, plus optional `dependencies` declaration. This approach adds structure for scenarios that need cleanup and enables dependency-ordered composition.

---

## Design

### Script format

A scenario is a class that implements the `Scenario` interface:

```ts
// repl/sold-pets.ts
import type { Scenario, ApplyContext } from "counterfact";

export default class SoldPetsScenario implements Scenario {
  static dependencies = ["base"];

  setup({ context, builders, route }: ApplyContext): void {
    context.petService.addPet({ id: 1, status: "sold" });
    context.petService.addPet({ id: 2, status: "available" });

    builders.set(
      "getSoldPets",
      route("/pet/findByStatus").method("get").query({ status: "sold" }),
    );
  }

  teardown({ context, builders }: ApplyContext): void {
    context.petService.removePet(1);
    context.petService.removePet(2);
    builders.delete("getSoldPets");
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

### Invocation

```
.apply sold-pets           # apply a named scenario
.unapply sold-pets         # tear down if teardown() is defined
.apply base sold-pets      # apply multiple scenarios in order
```

### Dependency resolution

When a scenario declares `static dependencies`, Counterfact automatically applies each dependency in order before applying the requested scenario. If a dependency is already applied (tracked by name), it is skipped.

```
⬣> .apply sold-pets
# Counterfact first applies "base" (dependency), then "sold-pets"
Applied base → sold-pets

Builders added:
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

- [ ] `.apply <name>` resolves, instantiates, and calls `setup()` on the scenario class
- [ ] Static `dependencies` are applied automatically before the target scenario
- [ ] A dependency that is already applied is not re-applied
- [ ] `.unapply <name>` calls `teardown()` on the applied scenario instance
- [ ] The REPL tracks and displays the stack of currently applied scenarios
- [ ] Scenarios that do not declare `teardown()` are still valid and usable
- [ ] A meaningful error is shown when a dependency cycle is detected
- [ ] Existing REPL commands and behavior are unaffected
