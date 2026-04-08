---
title: "Feature: Time-Travel Debugging for API Interactions"
parentIssue: 1716
labels:
  - enhancement
assignees: []
milestone:
---

Every serious computational medium needs a way to observe and reason about *time*. The history of a system is as important as its current state — yet most API mock tools throw that history away.

Counterfact should record every incoming request and outgoing response as an immutable, indexed log. From the REPL (or a browser UI), a developer could rewind the server to any prior state, branch from that point, or replay a sequence of interactions with different route handler logic. This transforms the mock server from a stateless responder into a **time-aware simulation environment**.

Why does this matter? When a frontend developer encounters a bug that only manifests after a specific sequence of API calls, they currently have no way to reproduce it reliably. With time-travel, they can scrub back to the exact moment before the failure, inspect context state, adjust a handler, and replay — without restarting anything or losing the surrounding conditions.

Alan Kay observed that the Dynabook dream was really about giving people a tool to think with, not just a tool to use. A debugger that can move through time is one of the most powerful thinking tools we can give to an API developer.

## Acceptance criteria

- [ ] All HTTP requests and responses handled by Counterfact are recorded to an in-memory interaction log with timestamps
- [ ] The REPL exposes `.history list` (show recent interactions) and `.history rewind <n>` (restore context state to what it was before interaction N)
- [ ] A maximum history depth is configurable (default: 100 interactions) to bound memory usage
- [ ] Rewinding restores the context object tree to its prior serialized state; route handlers are not changed
- [ ] The interaction log is accessible programmatically for use in tests and automation
- [ ] History is cleared on server restart or via `.history clear`
