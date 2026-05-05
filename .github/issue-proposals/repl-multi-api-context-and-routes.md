---
title: "repl: expose multi-API context/routes by group name"
parentIssue: 1893
labels:
  - enhancement
  - repl
assignees: []
milestone:
---

When Counterfact runs multiple `ApiRunner`s, the REPL currently uses only the first runner. This proposal updates REPL bootstrapping so all runners are available and scenario/route helpers can target each API by group key.

## Context

Multi-spec projects need to inspect and mutate state across APIs (for example `billing` and `inventory`) in one REPL session. Today, only the first runner is wired into `context`, `loadContext`, and `route`, so users cannot reliably operate on non-primary APIs.

## Proposed change

Update app/repl wiring so REPL receives all active runners and builds grouped affordances:

- `context` becomes a map keyed by API group (`context.billing`, `context.inventory`, ...)
- `routes` becomes a grouped map using the same keys
- helper wiring is updated so grouped APIs can be addressed consistently
- single-runner mode keeps current unqualified behavior for backwards compatibility

## Acceptance criteria

- [ ] REPL startup path passes all configured runners (not only the first) into REPL initialization
- [ ] In multi-runner mode, `context` and `routes` are keyed by each runner's group name
- [ ] Behavior for a single runner remains unchanged (`context` remains the root context object)
- [ ] Group-key collisions or missing group names are handled deterministically and documented in code/tests
- [ ] Unit tests cover single-runner and multi-runner REPL context wiring
