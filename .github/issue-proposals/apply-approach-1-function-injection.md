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

Implement `.apply` as a plain TypeScript module that exports one or more named functions. When the command is run, Counterfact dynamically imports the file, looks up the named export matching the last path segment, calls that function, and passes the live REPL environment as its argument.

This is the simplest possible design: no new abstractions, no DSL, and no framework. A script is just a named function.

---

## Design

### Script format

An apply script is a TypeScript file with one or more named function exports:

```ts
// scenarios/sold-pets.ts
import type { ApplyContext } from "./types";

export function soldPets($: ApplyContext) {
  $.context.petService.reset();
  $.context.petService.addPet({ id: 1, status: "sold" });
  $.context.petService.addPet({ id: 2, status: "available" });

  $.routes.getSoldPets = $.route("/pet/findByStatus").method("get").query({ status: "sold" });
}
```

### The `ApplyContext` type

`ApplyContext` is a generated type that lives in `./types/`. In this first iteration it is always the same shape. In future iterations it will incorporate types from `_.context.ts` files, providing route-specific context types.

```ts
export interface ApplyContext {
  /** Root context, same as loadContext("/") */
  context: Record<string, unknown>;
  /** Load a context object for a specific path */
  loadContext: (path: string) => Record<string, unknown>;
  /** Named route builders available in the REPL execution context */
  routes: Record<string, RouteBuilder>;
  /** Create a new RouteBuilder for a given path */
  route: (path: string) => RouteBuilder;
}
```

### Invocation

The argument to `.apply` is a slash-separated path. The last segment is the **function name** to call; everything before it is the **file path** (resolved relative to `<basePath>/scenarios/`, with `index.ts` as the default file):

```
.apply foo          # scenarios/index.ts  → foo($)
.apply foo/bar      # scenarios/foo.ts    → bar($)
.apply foo/bar/baz  # scenarios/foo/bar.ts → baz($)
```

### Feedback output

After execution, the REPL prints:

```
Applied sold-pets/soldPets
```

---

## Implementation sketch

1. Add `.apply` as a dot-command in `src/repl/repl.ts`.
2. Split the argument on `/`: the last segment is the function name; the rest form the file path.
3. Dynamically import the resolved module (using `tsx` or the existing transpiler if the file is TypeScript).
4. Look up the named export matching the function name and call it with the live environment objects.

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

- [ ] `.apply foo` resolves `scenarios/index.ts` and calls the exported `foo` function
- [ ] `.apply foo/bar` resolves `scenarios/foo.ts` and calls the exported `bar` function
- [ ] `.apply foo/bar/baz` resolves `scenarios/foo/bar.ts` and calls the exported `baz` function
- [ ] The function receives `$` with `{ context, loadContext, routes, route }` as properties
- [ ] Routes injected by the script are available in the REPL after the command runs
- [ ] The REPL prints `Applied <path>` after each successful apply
- [ ] A meaningful error is shown when the file cannot be found or the export is not a function
- [ ] Existing REPL commands and behavior are unaffected
