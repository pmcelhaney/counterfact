---
title: "Add `counterfact agent-prompt` command to generate LLM system prompts"
parentIssue: 1720
labels:
  - enhancement
  - agent-ux
  - dx
assignees: []
milestone:
---

AI coding agents work best when given a precise system prompt that tells them the capabilities and conventions of the tools they are using. Today there is no built-in way to describe Counterfact — its Admin API endpoints, context model, route conventions, and OpenAPI-driven type system — in a format suitable for injection into an LLM context window.

A `counterfact agent-prompt` CLI command would auto-generate a tailored system prompt from the running server, giving agents everything they need to generate correct route handlers and Admin API calls on the first attempt.

## Proposed change

Add a new sub-command to the CLI:

```bash
npx counterfact agent-prompt [--url <server-url>] [--format <markdown|json>]
```

When run, the command:

1. Connects to the Counterfact Admin API at `<server-url>` (default `http://localhost:3100`).
2. Fetches `/_counterfact/api/openapi`, `/_counterfact/api/routes`, and `/_counterfact/api/config`.
3. Generates a structured prompt containing:
   - A short description of Counterfact's purpose and conventions.
   - The list of registered routes (path + method + summary from the spec).
   - The Admin API surface (endpoints, request/response shapes).
   - The context model (how to read and write context via the Admin API).
   - TypeScript route handler conventions (file structure, `$.context`, response helpers).
4. Writes the prompt to stdout (for piping into other tools) or to a file with `--output <path>`.

### Example output (abbreviated)

```markdown
# Counterfact Mock Server — Agent Instructions

## Server info
- Base URL: http://localhost:3100
- OpenAPI spec: petstore3

## Available routes
- GET  /pet/{petId}  → Find pet by ID
- POST /pet          → Add a new pet

## Admin API
- GET  /_counterfact/api/health         → Server health
- POST /_counterfact/api/contexts/reset → Reset all context state
…

## Writing route handlers
Route handlers live in `./api/routes/`. Each file exports GET, POST, etc.
Use `$.context` to read/write shared state. Return `{ status: 200, body: … }`.
```

## Motivation

- Reduces the number of LLM iterations needed to produce a working route handler from scratch.
- Makes the Admin API self-describing — an agent can call `agent-prompt`, inject the output into its context window, and immediately start using the Admin API correctly.
- Keeps the prompt up-to-date automatically: because it is generated from the live server, it always reflects the actual spec and config.

## Acceptance criteria

- [ ] `npx counterfact agent-prompt` prints a Markdown prompt to stdout when a Counterfact server is running locally on the default port
- [ ] The prompt includes the list of registered routes with HTTP methods and summaries
- [ ] The prompt includes a description of every Admin API endpoint
- [ ] `--format json` outputs a machine-readable JSON object with the same information
- [ ] `--output <path>` writes the prompt to a file instead of stdout
- [ ] The command exits with a non-zero code and a clear error message when the server is not reachable
- [ ] The command is documented in `docs/usage.md` under a new "Using with AI agents" section
