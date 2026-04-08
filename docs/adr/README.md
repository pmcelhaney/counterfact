# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for Counterfact, using Andrew Harmel-Law's "Architecture Advice" template from _Facilitating Software Architecture_.

## What is an ADR?

An ADR captures the context, options considered, decision taken, and expected consequences for a significant architectural choice. ADRs are living documents reviewed and discussed in pull requests before a decision is finalised.

## Template Sections

Each ADR uses these sections:

| Section | Purpose |
|---------|---------|
| **Title** | Short, descriptive name for the decision |
| **Status** | `proposed`, `accepted`, `superseded by [NNN]`, etc. |
| **Context** | The problem or forces that prompted this decision |
| **Decision** | The choice that was made |
| **Options** | Alternatives that were considered (with brief pros/cons) |
| **Consequences** | Outcomes, trade-offs, and follow-up work resulting from the decision |
| **Advice** | Guidance for anyone implementing or working within this decision |

## File Naming

New ADR files are named `xxx-short-title.md` (with a literal `xxx` prefix) when first drafted. When the PR is merged to `main`, a CI automation replaces `xxx` with the next sequential three-digit number (e.g. `001`, `002`).

## Workflow

1. **Identify** a significant architectural problem or decision point.
2. **Draft** an ADR as `docs/adr/xxx-short-title.md` on a new branch.
3. **Discuss** the ADR in a pull request — update the document as the conversation evolves.
4. **Decide** — update the Status to `accepted` and fill in the Decision section.
5. **Merge** the PR. CI automatically assigns the next sequential ADR number.
6. **Plan implementation** — create a follow-up issue asking Copilot to break the decision into implementation tasks.
