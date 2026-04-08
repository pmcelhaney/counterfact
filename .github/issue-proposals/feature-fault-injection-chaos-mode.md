---
title: "Feature: Fault Injection & Chaos Mode for Resilience Testing"
parentIssue: 1716
labels:
  - enhancement
assignees: []
milestone:
---

The best mock server is not one that always succeeds. It is one that can fail — predictably, controllably, and on demand. Real APIs are slow, unreliable, and prone to returning unexpected errors. A frontend application that only ever talks to a perfect mock server is a frontend that will break in production.

Counterfact should have a first-class fault injection system: a way to configure any route (or all routes) to introduce latency, return error status codes, drop connections, or corrupt response bodies — either deterministically or probabilistically. This mode would be togglable from the REPL, the dashboard, or the CLI, without modifying any route handler files.

Think of it as a chaos engineering layer for your local development environment. Instead of finding out that your UI freezes when an API call takes 10 seconds, you find out during development — because you configured your mock to add 10 seconds of latency to the `/search` endpoint with one REPL command.

Alan Kay often pointed out that a system that has never been stress-tested against failure has never truly been understood. Fault injection is not a testing feature; it is a *comprehension* feature. It reveals what your frontend actually does when the world stops cooperating.

## Acceptance criteria

- [ ] A `$.fault` helper is available in route handlers to configure probabilistic or deterministic faults (latency, error status codes, dropped connections)
- [ ] The REPL exposes `.fault <path> latency <ms>` and `.fault <path> error <statusCode> [probability]` commands
- [ ] Faults can be applied globally (`*`) or scoped to a specific route path or HTTP method
- [ ] A "chaos mode" (`--chaos`) CLI flag enables random low-level faults (5–10% failure rate, random latency up to 2000ms) across all routes as a default starting point
- [ ] Configured faults are visible in the dashboard with an indicator on affected routes
- [ ] Faults can be cleared individually or all at once via `.fault clear`
- [ ] Fault configuration is serializable and can be saved/restored as part of a simulation world or playbook seed
