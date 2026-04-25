---
title: "repl: version-aware context, routes, and .scenario for multi-version APIs"
parentIssue: 1937
labels:
  - enhancement
  - repl
assignees: []
milestone:
---

Extend the REPL so that users interacting with a multi-version API server can address context, routes, and scenarios by both group and version, not just by group.

## Context

When the same group has multiple versions (e.g. `my-api/v1` and `my-api/v2`), each version is backed by its own `ApiRunner` with its own `contextRegistry` and `scenarioRegistry`. The REPL currently keys its helpers by group name alone. With multiple runners per group, the group key is no longer sufficient to uniquely identify a runner.

## Proposed change

### Context and routes helpers

In multi-version mode, extend the grouped helper objects with a second level keyed by version:

```
context.myApi.v1   // context for my-api v1
context.myApi.v2   // context for my-api v2
routes.myApi.v1    // route helpers for my-api v1
```

When a group has only one version (or no version), the existing flat `context.myApi` / `routes.myApi` shape is preserved.

### `.scenario` command

Extend `.scenario` to accept an optional version qualifier:

- Single-runner (no version): `.scenario <path>` (unchanged)
- Multi-runner, no version: `.scenario <group> <path>` (existing multi-runner syntax, unchanged)
- Multi-runner, with versions: `.scenario <group> <version> <path>`

Unknown group or version combinations should produce a descriptive error that lists available groups and versions.

### Tab completion

Update the `.scenario` completer to suggest version keys after a valid group key has been typed, in the same two-stage pattern used for group keys today.

## Acceptance criteria

- [ ] In multi-version mode, `context.<group>.<version>` and `routes.<group>.<version>` are available in the REPL
- [ ] In multi-version mode, `.scenario <group> <version> <path>` executes scenarios against the correct runner
- [ ] Tab completion after `.scenario <group> ` suggests available version keys for that group
- [ ] Tab completion after `.scenario <group> <version> ` suggests scenario paths for that group/version
- [ ] Unknown group or version produces a clear error listing available options
- [ ] Single-runner and multi-runner-without-version behaviors are unchanged
- [ ] Unit tests cover context/routes wiring and `.scenario` dispatch for all modes
