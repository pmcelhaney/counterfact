---
title: Refactor conditional tests for jest/no-conditional-in-test
parentIssue: 1901
---

Refactor test cases that trigger `jest/no-conditional-in-test` so assertions are deterministic and intent remains clear.

## Context and motivation

The rule catches conditional logic that can hide assertion paths. Some current uses are intentional helper patterns, while others can be simplified.

## Acceptance criteria

- [ ] Current warning sites are reviewed and categorized as refactor or keep-with-justification
- [ ] Refactorable tests are rewritten to avoid in-test branching
- [ ] Any remaining exceptions are narrowly suppressed with rationale
- [ ] Net warning count for this rule is reduced
