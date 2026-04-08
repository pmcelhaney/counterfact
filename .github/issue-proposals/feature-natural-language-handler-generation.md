---
title: "Feature: Natural Language Route Handler Generation"
parentIssue: 1716
labels:
  - enhancement
  - generator
assignees: []
milestone:
---

The barrier to writing a custom route handler should be zero. Right now, even the simplest customization requires a developer to understand TypeScript, the Counterfact response builder API, and where the generated files live. That is too high a bar for QA engineers, technical writers, product managers, and developers new to the codebase who just need to say *"this endpoint should return a list of three pets with names Fluffy, Spot, and Whiskers"*.

Counterfact should offer a natural language mode — available in the REPL, the browser dashboard, and a CLI command — where a developer describes the intended behavior of a route handler in plain English, and Counterfact generates the TypeScript implementation. The generated code is written to the route file immediately and takes effect via hot reload.

This is not about replacing developers with AI. It is about removing the *transcription cost* between knowing what you want and having a working mock. The developer's intent is the real thing; the TypeScript code is just a representation of it. When we can go from intent to representation instantly, we remove the friction that causes people to give up and return to hardcoded JSON fixtures.

Alan Kay spent decades arguing that the hard part of programming is thinking, not typing. Anything that reduces the distance between thought and working code amplifies human capability. This feature is that reduction applied to API simulation.

## Acceptance criteria

- [ ] The REPL exposes a `.describe <path> <method> "<description>"` command that generates a TypeScript route handler from a natural language description
- [ ] The browser dashboard includes a "Generate Handler" panel where developers can type a description and preview the generated code before applying it
- [ ] A CLI command (`counterfact generate-handler <path> <method> --description "..."`) generates a handler non-interactively
- [ ] Generated handlers are syntactically valid TypeScript that passes the project's type checks
- [ ] The generation prompt always includes the relevant OpenAPI schema context to ensure type correctness
- [ ] Generated code includes a comment noting it was AI-generated and the original natural language description used
- [ ] If the LLM is unavailable or unconfigured, a clear, actionable error message explains how to set up the integration (e.g., via `OPENAI_API_KEY` environment variable)
