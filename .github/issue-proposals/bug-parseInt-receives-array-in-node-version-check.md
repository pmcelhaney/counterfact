---
title: "Bug: parseInt() receives an array instead of a string in Node version check"
parentIssue: 1692
labels:
  - bug
assignees: []
milestone:
---

In `bin/counterfact.js`, the Node.js version check passes the result of `String.prototype.split()` — an array — directly to `Number.parseInt()`:

```js
// bin/counterfact.js
if (Number.parseInt(process.versions.node.split("."), 10) < MIN_NODE_VERSION) {
```

`process.versions.node.split(".")` returns an array like `["22", "3", "0"]`. When this is passed to `Number.parseInt()`, JavaScript implicitly calls `.toString()` on it, producing the string `"22,3,0"`. `parseInt` then parses up to the first non-numeric character (the comma), yielding `22`. This happens to give the correct major version **by accident**.

The correct code is:

```js
if (Number.parseInt(process.versions.node.split(".")[0], 10) < MIN_NODE_VERSION) {
```

While the current code produces the right result today, it:
- Relies on implicit coercion that is hard to reason about
- Would silently produce wrong results if the version string format changes
- Is a clear programming error that could confuse contributors

## Acceptance criteria

- [ ] `process.versions.node.split(".")[0]` (array index `[0]`) is used instead of passing the whole array to `parseInt`
- [ ] The version guard still exits with an error message when run on a Node version below the minimum
- [ ] Existing tests continue to pass
