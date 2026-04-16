---
title: Resolve jest/expect-expect warnings
parentIssue: 1901
---

Address `jest/expect-expect` warnings by adding explicit assertions or using approved assertion patterns for helper-driven tests.

## Context and motivation

Some tests rely on side-effect or thrown-error pathways that are not always detected by the rule. We should make assertions explicit where practical.

## Acceptance criteria

- [ ] Current warning sites are triaged
- [ ] Tests that can include direct assertions are updated
- [ ] Legitimate helper patterns are configured or suppressed in a narrow, documented way
- [ ] Net warning count for this rule is reduced

