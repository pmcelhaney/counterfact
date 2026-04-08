---
title: ".apply Command Design (Approach 3): Reactive Proxy-Based Change Tracking"
parentIssue: 1596
labels:
  - enhancement
  - repl
  - design
assignees: []
milestone:
---

## Summary

Implement `.apply` by wrapping the REPL environment in reactive proxies before executing the script. Instead of requiring a specific function signature or class structure, the script mutates the environment directly. All changes are automatically recorded by the proxy layer and printed as a structured diff after the script completes.

This approach maximises ergonomics for script authors: a script looks like ordinary TypeScript setup code with no framework coupling.

---

## Design

### Script format

A script is a plain TypeScript module that exports one or more named functions. The script receives the live environment objects and mutates them directly, with no special wrapper required:

```ts
// repl/sold-pets.ts
export function soldPets($) {
  $.context.petService.reset();

  $.context.petService.addPet({ id: 1, status: "sold" });
  $.context.petService.addPet({ id: 2, status: "available" });

  $.routes.getSoldPets = $.route("/pet/findByStatus").method("get").query({ status: "sold" });
}
```

This is identical in surface syntax to Approach 1. The difference is internal: `$.context` and `$.routes` passed to the script are **transparent reactive proxies** of the live objects.

### Proxy-based change tracking

Before calling the script, Counterfact wraps each environment object in a `Proxy` that intercepts `set`, `deleteProperty`, and property mutations on the `routes` plain object:

```ts
const tracked = trackChanges(liveContext);
const trackedRoutes = trackChanges(liveRoutes);
const fn = module[functionName]; // named export resolved from path
await fn({ context: tracked.proxy, routes: trackedRoutes.proxy, route: createRouteFunction(...) });
const report = { context: tracked.changes(), routes: trackedRoutes.changes() };
```

The proxy forwards all reads and writes to the underlying live object, so mutations take effect immediately. It also accumulates a change log:

```ts
interface ChangeRecord {
  type: "set" | "delete";
  path: string[]; // e.g. ["petService", "pets", "0"]
  before: unknown;
  after: unknown;
}
```

### Feedback output

After the script runs, Counterfact automatically prints a diff derived from the recorded changes:

```
Applied sold-pets/soldPets

Context changes:
  petService.pets: [] → [{id:1,status:"sold"},{id:2,status:"available"}]

Routes added:
  getSoldPets
```

No manual annotation is required from the script author.

### Invocation

The same path/name convention as Approach 1 applies:

```
.apply foo          # repl/index.ts  → foo($) with proxy-wrapped $
.apply foo/bar      # repl/foo.ts    → bar($) with proxy-wrapped $
.apply foo/bar/baz  # repl/foo/bar.ts → baz($) with proxy-wrapped $
```

Resolution is the same as Approach 1; the difference is purely in what is passed to the function.

---

## Implementation sketch

1. Add `.apply` as a dot-command in `src/repl/repl.ts`.
2. Split the argument on `/`: the last segment is the function name; the rest form the file path.
3. Create proxy wrappers around `context` and `routes`.
4. Dynamically import the module, look up the named export, and call it with the proxy-wrapped arguments.
5. Collect the accumulated change records from the proxies.
6. Print the formatted diff.

### Proxy wrapper (sketch)

```ts
function trackChanges<T extends object>(target: T) {
  const changes: ChangeRecord[] = [];

  const proxy = new Proxy(target, {
    set(obj, prop, value) {
      changes.push({ type: "set", path: [String(prop)], before: obj[prop as keyof T], after: value });
      return Reflect.set(obj, prop, value);
    },
    deleteProperty(obj, prop) {
      changes.push({ type: "delete", path: [String(prop)], before: obj[prop as keyof T], after: undefined });
      return Reflect.deleteProperty(obj, prop);
    },
  });

  return { proxy, changes: () => changes };
}
```

Deep (nested) change tracking can be implemented by returning a recursive proxy from the `get` trap.

---

## Trade-offs

| Aspect | Notes |
|---|---|
| **Ergonomics** | Scripts require no special structure; write ordinary setup code |
| **Automatic introspection** | All mutations are captured without script-author effort |
| **Complexity** | Proxy layer adds runtime complexity; deep tracking is non-trivial |
| **Edge cases** | Mutations via prototype methods (e.g. `array.push`) require careful proxy design |
| **Debugging** | Proxy stack traces can obscure the origin of errors |
| **Composability** | Scripts compose via normal `import`; proxy context flows through naturally |

---

## Acceptance criteria

- [ ] `.apply foo/bar` resolves `repl/foo.ts`, calls `bar($)` with proxy-wrapped environment objects
- [ ] All top-level property assignments to `context` are captured in the change log
- [ ] Nested property mutations (e.g. `context.petService.reset()`) are captured where feasible
- [ ] `$.routes.name = builder` assignments and `delete $.routes.name` are captured and reported
- [ ] After the script runs, the REPL prints a structured diff of all recorded changes
- [ ] The underlying live objects are mutated correctly (proxy is transparent for reads and writes)
- [ ] Scripts that throw an error do not leave the change-tracking proxy in an inconsistent state
- [ ] Existing REPL commands and behavior are unaffected
