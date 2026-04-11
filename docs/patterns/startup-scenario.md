# Seed Data on Startup

You want the mock server to have realistic dummy data from the moment it starts, without having to type commands into the REPL every time.

## Problem

A stateful mock server starts with an empty context. Every time you restart the server you have to manually re-seed data through the REPL before your client code has anything to work with. This is tedious during development and error-prone in demos.

## Solution

Export a function called `startup` from `scenarios/index.ts`. Counterfact calls it automatically when the server initializes, right before the REPL prompt appears. It receives the same `$` argument as any other scenario function, so it has full access to the context and route builder.

```ts
// scenarios/index.ts
import type { Scenario } from "../types/scenario-context.js";

export const startup: Scenario = ($) => {
  $.context.addPet({ name: "Fluffy", status: "available", photoUrls: [] });
  $.context.addPet({ name: "Rex",    status: "sold",      photoUrls: [] });
  $.context.addPet({ name: "Bella",  status: "pending",   photoUrls: [] });
};
```

If `startup` is absent from `scenarios/index.ts`, the server starts normally with no error.

## Keeping startup clean by delegating to helpers

When seeding many resources, delegate to focused helper functions in other scenario files and pass `$` along. You can also pass additional arguments to configure each helper:

```ts
// scenarios/index.ts
import type { Scenario } from "../types/scenario-context.js";
import { addPets } from "./pets.js";
import { addOrders } from "./orders.js";

export const startup: Scenario = ($) => {
  addPets($, 20, "dog");
  addOrders($, 5);
};
```

```ts
// scenarios/pets.ts
import type { ApplyContext } from "../types/scenario-context.js";

export function addPets($: ApplyContext, count: number, species: string) {
  for (let i = 0; i < count; i++) {
    $.context.addPet({
      name: `${species} ${i + 1}`,
      status: "available",
      photoUrls: [],
    });
  }
}
```

```ts
// scenarios/orders.ts
import type { ApplyContext } from "../types/scenario-context.js";

export function addOrders($: ApplyContext, count: number) {
  for (let i = 0; i < count; i++) {
    $.context.addOrder({ petId: i + 1, quantity: 1, status: "placed" });
  }
}
```

Each helper can be re-used as a standalone `.scenario` command from the REPL:

```
⬣> .scenario pets/addPets
```

## Consequences

- The server is immediately useful from the first request, with no manual seeding step.
- Restarting the server always produces the same deterministic initial state.
- Each helper function stays small and focused; `startup` serves as an explicit, readable composition root.
- Because helpers accept extra arguments, the same function can be called from `startup` with production-like volumes and from the REPL with minimal data during debugging.

## Related Patterns

- [Mock APIs with Dummy Data](./mock-with-dummy-data.md) — the full range of approaches for populating server responses
- [Live Server Inspection with the REPL](./repl-inspection.md) — use `.scenario` commands to adjust state after startup
- [Federated Context Files](./federated-context.md) — organize stateful logic across multiple context files
