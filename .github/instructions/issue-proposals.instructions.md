# Issue Proposal Authoring Instructions

This file defines the conventions for proposing new GitHub issues in the Counterfact repository.

## Overview

Copilot and contributors **must never create GitHub issues directly** via the API, browser automation, or any other means. Instead, propose issues as Markdown files in a pull request. A GitHub Action automatically converts them into real issues when the pull request is merged.

**Open a pull request** that adds the proposal files. The CI workflow triggers on merge and processes all newly added files.

## File Location

Place proposal files in:

```
.github/issue-proposals/
```

Use a descriptive, kebab-case filename, for example:

```
.github/issue-proposals/add-jsdocs-to-generated-types.md
```

## File Format

Each proposal file must be a Markdown document with a YAML front matter block at the top.

```md
---
title: Add JSDocs to generated types
parentIssue: 1234
labels:
  - enhancement
  - generator
assignees: []
milestone:
---

Generate JSDoc comments for emitted TypeScript types using metadata from the OpenAPI spec.

## Acceptance criteria

- Description fields map to JSDoc where available
- Parameter and schema docs are preserved
- Generated output remains valid TypeScript
```

## Fields

### Required

| Field | Description |
|-------|-------------|
| `title` | The issue title. Must not be empty. |
| Body content | The Markdown text after the front matter block. Must not be empty. |

### Optional

| Field | Description |
|-------|-------------|
| `parentIssue` | GitHub issue number this issue should become a sub-issue of. **Include this whenever you know the parent issue number.** |
| `labels` | List of label names to apply to the issue. |
| `assignees` | List of GitHub usernames to assign. |
| `milestone` | Milestone title or number to assign. |

## Parent Issue Behavior

Every created issue is registered as a sub-issue of the current parent issue.

- **Always include `parentIssue` in front matter** when you know the parent issue number. This makes the relationship explicit and auditable in the proposal file.
- If `parentIssue` is absent, the CI workflow derives the parent from the branch name (for example, a branch named `fix-1234-description` implies issue `#1234`).
- If the workflow cannot determine the parent issue at all, the proposal file is **not processed** and the workflow fails. In that case, add `parentIssue` to the front matter and re-run.

## Rules for Copilot

- **Never** create GitHub issues directly through the API, browser automation, or any other mechanism.
- **Always** propose new issues as Markdown files under `.github/issue-proposals/`.
- **Always** open a pull request that adds the proposal files.
- Include `parentIssue` in the front matter whenever you know the parent issue number.
- Write clear issue bodies with:
  - A summary of the problem or feature
  - Context and motivation
  - Acceptance criteria (as a Markdown checklist)

## What Happens After Merge

When a pull request that adds files under `.github/issue-proposals/` is merged, the CI workflow (`.github/workflows/create-issues.yml`) automatically:

1. Identifies which `.md` files were newly added by the pull request.
2. Parses each newly added file.
3. Validates required fields (`title` and a non-empty body).
4. Creates a GitHub issue.
5. Links it as a sub-issue of the resolved parent issue.
6. Applies `labels`, `assignees`, and `milestone` when provided.

The proposal files remain in the repository after issues are created. They serve as a permanent record of what was proposed and when. You do not need to remove them manually.

If creation fails for any file, that file is left in the repository and the workflow fails so it can be retried after the problem is fixed.

## Validation Rules

The workflow fails if:

- Front matter is missing or contains invalid YAML.
- `title` is missing or empty.
- The body content after the front matter is empty.
- The parent issue cannot be determined from either front matter or the branch name.

The workflow does **not** fail merely because `parentIssue` is absent from front matter.
