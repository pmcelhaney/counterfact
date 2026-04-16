---
title: Update regex capture groups for regexp/prefer-named-capture-group
parentIssue: 1901
---

Apply mechanical regex updates for `regexp/prefer-named-capture-group` warnings using named or non-capturing groups as appropriate.

## Context and motivation

This is low-risk cleanup with small warning count. The update should improve readability while preserving behavior.

## Acceptance criteria

- [ ] All current warning sites are updated to named or non-capturing capture groups
- [ ] Existing behavior is preserved by tests
- [ ] `regexp/prefer-named-capture-group` warnings are eliminated

