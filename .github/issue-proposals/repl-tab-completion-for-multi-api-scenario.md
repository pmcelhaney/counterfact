---
title: "repl: update tab completion for group-qualified .scenario"
parentIssue: 1893
labels:
  - enhancement
  - repl
assignees: []
milestone:
---

Update REPL tab completion so `.scenario` completions reflect the new multi-API qualifier syntax while preserving the current single-API experience.

## Context

Current completion assumes `.scenario <path>`. With multiple runners, users need completions for:

1. available group keys after `.scenario `
2. scenario paths/functions after `.scenario <group> `

## Proposed change

Refactor the `.scenario` completer to operate in two stages for multi-runner mode and keep existing path/function completion for single-runner mode.

## Acceptance criteria

- [ ] In multi-runner mode, typing `.scenario ` offers available group keys
- [ ] In multi-runner mode, typing `.scenario <group> ` offers scenario path/function completions scoped to that group
- [ ] Invalid groups do not crash completion and fall back gracefully
- [ ] In single-runner mode, existing `.scenario <path>` completions are preserved
- [ ] REPL tests assert completion behavior for both modes and nested scenario paths
