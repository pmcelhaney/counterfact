# Architecture Decision Records

## Title

Architecture Decision Records

## Status

Accepted

## Context

Counterfact is growing in complexity. Significant technical and process decisions are being made regularly — about code generation, server design, developer experience, and the development workflow itself. Without a structured record of these decisions, the reasoning behind choices becomes lost over time, making it hard for contributors (human or AI) to understand why things are the way they are, or to make consistent future decisions.

Copilot is increasingly involved in implementing features. For Copilot to make good decisions, it needs clear architectural context. An ADR process creates a durable, reviewable record of that context.

There are many ADR formats. Andrew Harmel-Law's "Architecture Advice" template, described in _Facilitating Software Architecture_, was chosen because it emphasises advice and consequences rather than just recording what was decided — making it actionable for future contributors.

## Decision

Introduce an ADR process for Counterfact using Andrew Harmel-Law's "Architecture Advice" template. ADRs live under `docs/adr/`. A CI automation assigns sequential numbers to new ADRs when they are merged.

## Options

### Option A: No ADR process (status quo)

Decisions are captured in issue comments, PR descriptions, and commit messages.

- **Pro:** No extra overhead.
- **Con:** Reasoning is scattered and hard to locate. Context is lost over time.

### Option B: Lightweight ADRs in `docs/adr/` (chosen)

A simple Markdown file per decision, reviewed in PRs, auto-numbered on merge.

- **Pro:** Low overhead. Decisions are easy to find and link to. Reviewable before being finalised.
- **Con:** Requires discipline to write ADRs for all significant decisions. Auto-numbering adds a small CI step.

### Option C: Third-party ADR tooling (e.g. `adr-tools`)

Use an existing CLI tool to manage ADRs.

- **Pro:** Tooling handles numbering and cross-references automatically.
- **Con:** Adds a dependency. Less flexible for custom workflows. Doesn't integrate naturally with GitHub PR review.

## Consequences

- All significant architectural decisions for Counterfact will be documented in `docs/adr/`.
- Contributors (including Copilot) can consult ADRs to understand the reasoning behind design choices.
- A CI workflow must be created and maintained to auto-number ADR files on merge.
- Discipline is required: not every change needs an ADR, but anything affecting the architecture, developer workflow, or external contracts should have one.
- Future decisions may supersede existing ADRs; superseded ADRs are updated with a `Superseded by [NNN]` status rather than deleted.

## Advice

- Draft ADRs early — even a partially filled-in ADR creates useful discussion.
- Keep ADRs concise. They should capture context and reasoning, not replace implementation documentation.
- When implementing a decision, link the relevant ADR in commit messages and PR descriptions.
- When asking Copilot to implement a decision, reference the ADR so it has the necessary context.
- When a decision is revisited or reversed, update the old ADR's status to `Superseded by [NNN]` and create a new ADR explaining the change.
- The three-stage workflow for acting on a decision is: ADR → plan → implementation, with a human review at each stage.
