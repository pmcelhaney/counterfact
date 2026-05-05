---
title: Re-enable or remove disabled tests for jest/no-disabled-tests
parentIssue: 1901
---

Resolve `jest/no-disabled-tests` findings by re-enabling skipped tests or removing obsolete ones.

## Context and motivation

Disabled tests reduce confidence and can mask regressions over time. The remaining skipped tests should be intentional and temporary, or removed.

## Acceptance criteria

- [ ] Every currently skipped test is evaluated
- [ ] Tests that should remain are re-enabled with passing behavior
- [ ] Obsolete or no-longer-actionable skipped tests are removed
- [ ] `jest/no-disabled-tests` warnings are eliminated
