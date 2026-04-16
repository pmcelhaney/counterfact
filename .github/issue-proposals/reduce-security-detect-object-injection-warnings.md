---
title: Reduce security/detect-object-injection warnings
parentIssue: 1901
---

Reduce `security/detect-object-injection` warnings by replacing ambiguous dynamic object indexing with safer access patterns or documenting trusted usage.

## Context and motivation

Many warnings come from map-like structures and route/context registries where dynamic keys are expected. We need a consistent pattern for safe keyed access so this rule remains useful.

## Acceptance criteria

- [ ] All current `security/detect-object-injection` warning sites are triaged
- [ ] Risky dynamic lookups are refactored (for example, validated key guards or `Map` usage)
- [ ] Remaining suppressions include clear justification for why access is safe
- [ ] Net warning count for this rule is reduced
