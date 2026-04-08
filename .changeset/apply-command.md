---
"counterfact": minor
---

Add `.apply` REPL dot-command (Approach 1: Minimalist Function Injection).

The `.apply` command lets you run scenario scripts from the REPL prompt without leaving the terminal. A scenario is a plain TypeScript (or JavaScript) file that exports named functions. Each function receives an `ApplyContext` object with `{ context, loadContext, routes, route }` and can freely read or mutate state.

**Path resolution:**

| Command | File | Function |
|---|---|---|
| `.apply foo` | `scenarios/index.ts` | `foo` |
| `.apply foo/bar` | `scenarios/foo.ts` | `bar` |
| `.apply foo/bar/baz` | `scenarios/foo/bar.ts` | `baz` |

The `ApplyContext` type is written to `types/apply-context.ts` during code generation.
