---
"counterfact": minor
---

Export `ContextArgs` type from generated `types/scenario-context.ts` so that `_.context.ts` files can strongly type the `loadContext` and `readJson` parameters received in the Context constructor. The default `_.context.ts` template now imports and uses `ContextArgs`.
