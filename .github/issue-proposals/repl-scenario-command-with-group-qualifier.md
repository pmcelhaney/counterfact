---
title: "repl: add group-qualified .scenario command for multi-API"
parentIssue: 1893
labels:
  - enhancement
  - repl
assignees: []
milestone:
---

Extend `.scenario` so multi-API sessions can choose which API runner's scenario registry and context are used.

## Context

Scenario scripts are loaded per runner (`<base>/<group>/scenarios`). In multi-runner mode, `.scenario` needs an API qualifier to avoid ambiguity and to execute against the intended context/route helpers.

## Proposed change

Add dual command syntax:

- single-runner: `.scenario <path>` (existing behavior)
- multi-runner: `.scenario <group> <path>`

The command should resolve the selected group, load that group's scenario module, and pass the group's `context`, `loadContext`, `route`, and `routes` into the scenario function.

## Acceptance criteria

- [ ] `.scenario <group> <path>` executes scenarios for the selected group in multi-runner mode
- [ ] Unknown group names produce a clear error message with available group keys
- [ ] Invalid or missing arguments print mode-appropriate usage help
- [ ] Single-runner `.scenario <path>` behavior remains unchanged
- [ ] Unit tests cover parsing, error cases, and context binding for both single- and multi-runner modes
