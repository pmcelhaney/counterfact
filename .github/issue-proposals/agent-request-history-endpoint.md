---
title: "Expose request/response history via Admin API for agent introspection"
parentIssue: 1720
labels:
  - enhancement
  - agent-ux
assignees: []
milestone:
---

AI agents need to understand what happened during a sequence of calls in order to reason about correctness and debug failures. Currently the only way to see request/response pairs is to tail the debug log, which is not machine-readable and is not available via HTTP.

Adding a request-history endpoint to the Admin API gives agents a reliable, structured view of recent interactions without requiring external tooling.

## Proposed change

1. Add an in-memory ring buffer (e.g. last 100 entries, configurable via a `--history-size` flag or a field in `Config`) to the Koa dispatcher. After each request is handled, append a record:

```ts
interface ValidationError {
  location: "query" | "header" | "path" | "body";
  name?: string;   // parameter name (for query/header/path)
  path?: string;   // JSON Pointer (for body fields, e.g. "/price")
  message: string; // human-readable description
}

interface HistoryEntry {
  id: number;                  // monotonically increasing
  timestamp: string;           // ISO-8601
  method: string;
  path: string;
  query: Record<string, string>;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  statusCode: number;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  durationMs: number;
  validationErrors: ValidationError[];  // structured errors from the request-validator
}
```

2. Expose it via the Admin API:

```
GET /_counterfact/api/requests            → last N entries (newest first)
GET /_counterfact/api/requests?limit=10   → last 10 entries
DELETE /_counterfact/api/requests         → clear the history
```

## Motivation

- Agents can replay or compare request/response pairs to verify that their code is producing correct calls.
- Validation errors are surfaced alongside the request that triggered them, giving agents immediate, structured feedback.
- Human developers troubleshooting auto-generated routes also benefit from a time-ordered log of all interactions.

## Acceptance criteria

- [ ] After making several requests, `GET /_counterfact/api/requests` returns a JSON array of history entries in reverse-chronological order
- [ ] Each entry includes method, path, status code, request body, response body, duration, and any validation errors
- [ ] The `?limit=N` query parameter limits the number of returned entries
- [ ] `DELETE /_counterfact/api/requests` empties the history and returns `{ success: true }`
- [ ] Admin auth guard (bearer token / loopback) is applied to all history endpoints
- [ ] The ring buffer is capped (default 100 entries) to avoid unbounded memory growth
- [ ] Unit tests cover normal recording, the limit parameter, and the clear endpoint
