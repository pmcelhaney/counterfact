---
title: "scenarios: version-aware scenario loading and startup scenario for multi-version APIs"
parentIssue: 1937
labels:
  - enhancement
  - scenarios
assignees: []
milestone:
---

Update the scenario system so that each versioned API runner loads scenarios from a version-scoped directory, and the startup scenario receives version information so it can initialise per-version state.

## Context

Scenarios are currently loaded from `<basePath>/<group>/scenarios/`. When a group has multiple versions (`v1`, `v2`, …), scenarios that are specific to one version should live under `<basePath>/<group>/<version>/scenarios/` while shared scenarios can remain at `<basePath>/<group>/scenarios/`.

The startup scenario (`scenarios/index.ts` → `startup()`) runs once per runner and is given a `$` object with `context`, `loadContext`, and `route` helpers. In multi-version mode, the startup scenario may also need to know which version it is initialising.

## Proposed change

### Scenario directory resolution

When a runner's `SpecConfig` has a non-empty `version`, resolve scenario scripts from:

1. `<basePath>/<group>/<version>/scenarios/` (version-specific, searched first)
2. `<basePath>/<group>/scenarios/` (shared fallback)

When `version` is empty, use only `<basePath>/<group>/scenarios/` as today.

### Startup scenario `$` argument

Pass `$.version` (the version string, or `""` for unversioned runners) into the startup scenario's `$` argument so authors can branch initialisation logic:

```ts
// scenarios/index.ts
export const startup = ($: { context: …; version: string }) => {
  if ($.version === "v2") {
    $.context.featureFlags.newPagination = true;
  }
};
```

### `.scenario` REPL command

No changes are needed here beyond those tracked in the REPL version-awareness issue; scenario loading uses the same directory resolution rules described above.

## Acceptance criteria

- [ ] When `version` is set, scenario files in `<group>/<version>/scenarios/` are loaded and take precedence over same-named files in `<group>/scenarios/`
- [ ] Files in `<group>/scenarios/` remain available as a shared fallback in multi-version mode
- [ ] The startup scenario's `$` argument includes a `version` property containing the runner's version string
- [ ] The startup scenario's `$` argument has `version = ""` for unversioned runners (backwards compatible)
- [ ] Single-spec / single-version scenario loading is unchanged
- [ ] Unit tests cover version-scoped directory resolution and the fallback behavior
