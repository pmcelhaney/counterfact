---
"counterfact": minor
---

Pass the OpenAPI document to the Context class constructor in `_.context.ts`.

The `Context` constructor now receives an `openApiDocument` property alongside the existing `loadContext` and `readJson` helpers:

```ts
// routes/_.context.ts
export class Context {
  constructor({ openApiDocument, loadContext, readJson }) {
    this.openApiDocument = openApiDocument;
  }
}
```
