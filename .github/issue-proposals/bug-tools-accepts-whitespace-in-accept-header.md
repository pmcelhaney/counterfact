---
title: "Bug: Tools.accepts() fails when Accept header has spaces after commas"
parentIssue: 1650
labels:
  - bug
assignees: []
milestone:
---

A well-formed HTTP Accept header commonly separates values with `", "` (comma followed by a space), e.g. `"text/html, application/json"`.

`Tools.accepts()` splits on `","` but does **not** trim whitespace from each part. This produces `[" application/json"]` (with a leading space) as the second element. When that is further split on `"/"`, the type becomes `" application"` rather than `"application"`, so the comparison against the requested content type always fails and `accepts()` returns `false` even when the type is listed in the Accept header.

## Failing test

Added in `test/server/tools.test.ts`:

```
accepts('application/json') returns true when Accept header is 'text/html, application/json' (with space)
```

Run `yarn test` and look for that test name in the `tools` describe block.

## Root cause

```ts
// src/server/tools.ts
const acceptTypes = String(acceptHeader).split(",");
return acceptTypes.some((acceptType) => {
  const [type, subtype] = acceptType.split("/"); // " application" has a leading space
  ...
});
```

## Acceptance criteria

- [ ] Each token is trimmed (e.g. `acceptType.trim()`) before being split on `"/"`
- [ ] The previously failing test passes
- [ ] All other `accepts()` tests continue to pass
