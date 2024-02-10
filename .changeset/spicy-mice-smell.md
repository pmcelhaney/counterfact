---
"counterfact": patch
---

Fixed and simplified the way `\_.context.ts` files work.

- it's no longer necessary to have a `_.context.ts` file in every directory, only the ones where you want to establish a new context
- removed the need for `export type ContextType`
