---
title: Reduce security/detect-non-literal-fs-filename warnings
parentIssue: 1901
---

Address `security/detect-non-literal-fs-filename` warnings by introducing consistent path validation and narrowly scoped suppressions for trusted internal paths.

## Context and motivation

This rule currently generates the largest warning volume. Most hits are in internal file generation and migration flows where dynamic paths are expected. We should reduce noise without weakening protection for untrusted inputs.

## Acceptance criteria

- [ ] All current `security/detect-non-literal-fs-filename` warning sites are triaged as either fixable or intentionally ignored
- [ ] High-risk call sites that touch user-provided paths use explicit validation/normalization before file-system access
- [ ] Any lint suppressions include an inline safety rationale
- [ ] Net warning count for this rule is reduced
