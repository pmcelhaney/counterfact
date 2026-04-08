---
title: ".apply Command Design (Approach 1): Minimalist Function Injection"
parentIssue: 1596
labels:
  - enhancement
  - repl
  - design
assignees: []
milestone:
---

## Summary

Implement `.apply` as a plain TypeScript module that exports a single default function. When the command is run, Counterfact dynamically imports the file, calls the function, and passes the live REPL environment as arguments.

This is the simplest possible design: no new abstractions, no DSL, and no framework. A script is just a function.

---

## Design

### Script format

An apply script is a TypeScript file with a default export:

```ts
// repl/sold-pets.ts
import type { ApplyContext } from "counterfact";

export default ({ context, builders, route }: ApplyContext) => {
  context.petService.reset();
  context.petService.addPet({ id: 1, status: "sold" });
  context.petService.addPet({ id: 2, status: "available" });

  builders.set(
    "getSoldPets",
    route("/pet/findByStatus").method("get").query({ status: "sold" }),
  );
};
```

### The `ApplyContext` type

```ts
export interface ApplyContext {
  /** Root context, same as loadContext("/") */
  context: Record<string, unknown>;
  /** Load a context object for a specific path */
  loadContext: (path: string) => Record<string, unknown>;
  /** Named route builders injected into the REPL */
  builders: Map<string, RouteBuilder>;
  /** Create a new RouteBuilder for a given path */
  route: (path: string) => RouteBuilder;
}
```

### Invocation

```
.apply sold-pets
.apply path/to/sold-pets.ts
```

**Resolution order for named scenarios:**

1. `<basePath>/repl/<name>.ts`
2. `<basePath>/repl/<name>/index.ts`
3. `<basePath>/<name>.ts` (direct path)

### Feedback output

After execution, Counterfact compares the environment state before and after the script runs and prints a diff summary:

```
Applied sold-pets

Builders added:
  getSoldPets
```

Context diffs are not automatically tracked in this approach — the script author is responsible for noting any context changes in a comment or in the summary.

---

## Implementation sketch

1. Add `.apply` as a dot-command in `src/repl/repl.ts`.
2. Resolve the file path using the ordered lookup above.
3. Dynamically import the resolved module (using `tsx` or the existing transpiler if the file is TypeScript).
4. Call the exported function with the live environment objects.
5. Snapshot `builders` before/after and print the diff.

---

## Trade-offs

| Aspect | Notes |
|---|---|
| **Simplicity** | Minimal API surface; trivial to implement and test |
| **Flexibility** | Scripts have full control; no imposed lifecycle |
| **Composability** | Scripts can call each other via normal `import` |
| **Introspection** | Context changes are not automatically tracked |
| **TypeScript support** | First-class; leverages the existing transpiler |

---

## Acceptance criteria

- [ ] `.apply <name>` resolves and executes a TypeScript file from the configured `repl/` directory
- [ ] `.apply <path>` resolves and executes a TypeScript file at the given relative path
- [ ] The script receives `{ context, loadContext, builders, route }` as arguments
- [ ] Builders injected by the script are available in the REPL after the command runs
- [ ] The REPL prints a summary of builders added and removed after each apply
- [ ] A meaningful error is shown when the file cannot be found or the export is not a function
- [ ] Existing REPL commands and behavior are unaffected
