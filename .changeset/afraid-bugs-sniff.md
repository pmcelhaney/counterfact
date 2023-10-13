---
"counterfact": minor
---

Fixed an issue where the context object wasn't working as expected.

BREAKING CHANGE:

- the main $.context.ts file needs an extra line: `export type ContextType = typeof Context;`
- $.context.ts files below the root need to change to `export type { ContextType } from "../$.context";`
- if you modified any of the $.context.ts files below the root, treat the first bullet applies

When you run Counterfact, it will try to make these changes for you, so ideally you won't have to worry about it.
