---
title: "Include structured validation errors in HTTP response headers for agent-friendly feedback"
parentIssue: 1720
labels:
  - enhancement
  - agent-ux
assignees: []
milestone:
---

When an agent sends a request that fails OpenAPI schema validation, Counterfact currently returns a `400` response with a plain-text body such as `"query parameter 'status' is required"`. This is readable by humans but difficult for agents to parse reliably — they must scrape unstructured text to understand what went wrong.

Exposing validation errors as a structured JSON object (or as a machine-readable header) gives agents immediate, actionable feedback in a format they can act on directly.

## Proposed change

### Response body (when validation fails)

Change the `400` response body from plain text to a JSON object:

```json
{
  "error": "Validation failed",
  "validationErrors": [
    { "location": "query", "name": "status", "message": "is required" },
    { "location": "body",  "path": "/price", "message": "must be a number" }
  ]
}
```

Each entry in `validationErrors` should include:
- `location`: `"query"`, `"header"`, `"path"`, or `"body"`
- `name` (for parameters): the parameter name
- `path` (for body fields): the JSON Pointer path within the body
- `message`: the human-readable error message from Ajv or the required-parameter check

### Optional header

Also add the header:

```
X-Counterfact-Validation-Errors: <url-encoded JSON array>
```

so agents (or middleware) can inspect validation errors without parsing the response body.

### Config option

Add a boolean `strictValidation` config option (default `false`).

- When `true`, validation errors immediately return `400` before the route handler is called. The response body is always `{ "error": "Validation failed", "validationErrors": […] }`.
- When `false` (the current default), the handler is still called and its return value is used as the response body. If any validation errors exist, a top-level `validationErrors` key is added to the response body (the handler's own fields are preserved). If the handler's response body is not a JSON object (e.g. a string or array), `validationErrors` is instead delivered only via the `X-Counterfact-Validation-Errors` header to avoid mutating a non-object body.

## Motivation

- Agents generating request code iterate until they receive a valid response. Structured errors describe *exactly* what is wrong (which field, which constraint), letting the agent fix the request in one step instead of guessing.
- The `X-Counterfact-Validation-Errors` header allows agents using HTTP client libraries to inspect errors as metadata without having to deserialize the body.
- Structured errors are more stable than prose descriptions — future improvements to error messages won't break an agent's parsing logic.

## Acceptance criteria

- [ ] A request missing a required query parameter returns `400` with a JSON body containing a `validationErrors` array
- [ ] Each entry in `validationErrors` includes `location`, `name` or `path`, and `message`
- [ ] The `X-Counterfact-Validation-Errors` response header is populated when there are validation errors
- [ ] With `strictValidation: false` (default), the route handler is still invoked and the `validationErrors` array is included alongside the handler's response
- [ ] With `strictValidation: true`, the route handler is bypassed and `400` is returned immediately on any validation error
- [ ] Existing behaviour (handler receives the request even when input is invalid) is preserved by default
- [ ] Unit tests cover the structured error format for query, header, and body validation failures
