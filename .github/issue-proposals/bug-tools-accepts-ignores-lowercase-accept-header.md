---
title: "Bug: Tools.accepts() ignores lowercase 'accept' header — always returns true in production"
parentIssue: 1650
labels:
  - bug
assignees: []
milestone:
---

`Tools.accepts()` reads `this.headers.Accept` (capital A). Node.js normalises all incoming HTTP header names to **lowercase**, so when a real HTTP request is processed via Koa the header is stored under `accept` (lowercase). `this.headers.Accept` is therefore always `undefined` in production.

Because `undefined` triggers the early-return guard `if (acceptHeader === "" || acceptHeader === undefined) { return true; }`, the method unconditionally returns `true` — completely ignoring the client's actual Accept header.

## Failing test

Added in `test/server/tools.test.ts`:

```
accepts('application/json') returns false when lowercase 'accept' header is 'text/plain'
```

Run `yarn test` and look for that test name in the `tools` describe block.

## Root cause

```ts
// src/server/tools.ts
const acceptHeader = this.headers.Accept; // ← should be this.headers.accept
```

## Acceptance criteria

- [ ] `this.headers.Accept` is replaced by a case-insensitive lookup (or lowercased key lookup) so that `accept`, `Accept`, and `ACCEPT` all work
- [ ] The previously failing test passes
- [ ] All other `accepts()` tests continue to pass
