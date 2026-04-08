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

A script is a plain TypeScript module with a default export function. The script receives the live environment objects and mutates them directly, with no special wrapper required:

```ts
// repl/sold-pets.ts
export default ({ context, builders, route }) => {
  context.petService.reset();

  context.petService.addPet({ id: 1, status: "sold" });
  context.petService.addPet({ id: 2, status: "available" });

  builders.set(
    "getSoldPets",
    route("/pet/findByStatus").method("get").query({ status: "sold" }),
  );
};
```

This is identical in surface syntax to Approach 1. The difference is internal: `context` and `builders` passed to the script are **transparent reactive proxies** of the live objects.

### Proxy-based change tracking

Before calling the script, Counterfact wraps each environment object in a `Proxy` that intercepts `set`, `deleteProperty`, and `Map` mutations:

```ts
const tracked = trackChanges(liveContext);
await script({ context: tracked.proxy, builders: trackBuilders(liveBuilders) });
const report = tracked.changes(); // returns structured diff
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
Applied sold-pets

Context changes:
  petService.pets: [] → [{id:1,status:"sold"},{id:2,status:"available"}]

Builders added:
  getSoldPets
```

No manual annotation is required from the script author.

### Invocation

```
.apply sold-pets
.apply path/to/sold-pets.ts
```

Resolution order is the same as Approach 1:

1. `<basePath>/repl/<name>.ts`
2. `<basePath>/repl/<name>/index.ts`
3. `<basePath>/<name>.ts`

---

## Implementation sketch

1. Add `.apply` as a dot-command in `src/repl/repl.ts`.
2. Resolve the file path.
3. Create proxy wrappers around `context` and `builders`.
4. Dynamically import and call the script with the proxy-wrapped arguments.
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

- [ ] `.apply <name>` resolves and executes a TypeScript file, passing proxy-wrapped environment objects
- [ ] All top-level property assignments to `context` are captured in the change log
- [ ] Nested property mutations (e.g. `context.petService.reset()`) are captured where feasible
- [ ] `builders.set()` and `builders.delete()` calls are captured and reported
- [ ] After the script runs, the REPL prints a structured diff of all recorded changes
- [ ] The underlying live objects are mutated correctly (proxy is transparent for reads and writes)
- [ ] Scripts that throw an error do not leave the change-tracking proxy in an inconsistent state
- [ ] Existing REPL commands and behavior are unaffected
