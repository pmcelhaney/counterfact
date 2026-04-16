---
title: Audit and resolve security/detect-unsafe-regex warnings
parentIssue: 1901
---

Review each `security/detect-unsafe-regex` warning for potential ReDoS risk and either replace with safer regex patterns or annotate proven-safe usage.

## Context and motivation

Even with a small count, unsafe-regex findings can have high impact. Each pattern should be intentionally reviewed with input size and runtime behavior in mind.

## Acceptance criteria

- [ ] Every current `security/detect-unsafe-regex` warning has a documented disposition
- [ ] Any vulnerable or questionable regex is rewritten to avoid catastrophic backtracking
- [ ] Any suppression includes a proof-oriented safety note
- [ ] Rule warnings are reduced or eliminated without changing intended behavior
