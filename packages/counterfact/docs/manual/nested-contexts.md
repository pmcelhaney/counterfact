# Nested and connected contexts

Use nested contexts when separate route areas need their own state or behavior. A route uses the nearest `_.context.ts` in its directory or a parent directory.

## Divide state by route subtree

For example, put pet behavior in `routes/pets/_.context.ts` and user behavior in `routes/users/_.context.ts`. A handler in `routes/pets/{petId}.ts` sees the pet context as `$.context`.

## Connect contexts explicitly

A context receives `loadContext` in its constructor:

```ts
export class Context {
  constructor({ loadContext }) {
    this.rootContext = loadContext("/");
    this.petsContext = loadContext("/pets");
  }
}
```

This JavaScript-compatible example omits annotations; use the corresponding generated `Context$` type for typed TypeScript constructors. Call methods on connected contexts when an operation spans route areas. Avoid copying the same mutable data into each context.

## Choose a shared store for API groups

Contexts in separate API groups have separate registries. Use the [shared application store](../patterns/shared-store.md) when those groups represent one product and need the same domain data.

Context references survive ordinary hot reload. After an explicit simulator reset, reacquire them with `api.loadContext()`; previously held references belong to the old state. See [stateful contexts](../features/state.md) and [lifecycle reference](../api/simulator.md).
