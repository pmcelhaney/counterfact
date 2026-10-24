---
name: route
description: >
  Edit Counterfact route files to add endpoint behavior while keeping handlers
  thin and delegating business logic to context classes.
applyTo:
  - "**/routes/**/*.{ts,js}"
---

# Route Skill

## Purpose

Implement or update route behavior in generated route files.

## Required rules

- Always use exported function declarations for route handlers, with an explicit
  block body and `return`. This makes it easy to add statements as a route grows.
- Leave `$` unannotated in route handlers: `export function GET($) { ... }`.
  Do not add handler-type imports just for `$`. Preserve `async` when the
  handler uses `await`.
- When editing a generated arrow-function handler, convert it to a function
  declaration.

- Use the `$` API in every handler (`$.path`, `$.query`, `$.body`, `$.response`,
  `$.context`, `$.loadContext`).
- Route handlers must stay thin.
- Business logic must be delegated to a context class in an appropriate
  `_.context.ts` file.
- Do **not** create unit tests in this skill; routes are HTTP adapters and
  behavior should be validated through context tests and black-box/integration
  flows when available.

## Step-by-step

1. Open the target file under `routes/` (e.g. `routes/pet/{petId}.ts`).
2. Read input using `$` (`$.path`, `$.query`, `$.body`).
3. Call a context method for logic/state changes.
4. Return a response using `$.response[status]`.
5. If needed, add new context methods instead of embedding logic in the route.

## Pattern

```ts
export function POST($) {
  const created = $.context.createThing($.body);
  return $.response[201].json(created);
}
```

## References

- https://counterfact.dev/docs/features/state.html
- `packages/counterfact/src/server/dispatcher.ts` for runtime handler behavior
