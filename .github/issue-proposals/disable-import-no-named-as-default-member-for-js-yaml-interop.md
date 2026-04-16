---
title: Disable import/no-named-as-default-member for js-yaml interop noise
parentIssue: 1901
---

Disable `import/no-named-as-default-member` (or scope-disable it in affected test files) to remove false-positive warnings around `js-yaml` usage.

## Context and motivation

Current warnings are concentrated in test code and are not indicating real defects. Reducing this noise improves lint signal for higher-value findings.

## Acceptance criteria

- [ ] Existing warning sites are reviewed to confirm false-positive behavior
- [ ] Lint configuration is updated with the narrowest practical disable strategy
- [ ] No functional behavior changes are introduced in tests
- [ ] `import/no-named-as-default-member` warnings are eliminated
