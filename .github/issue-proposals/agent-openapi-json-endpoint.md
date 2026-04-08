---
title: "Serve parsed OpenAPI spec as JSON via Admin API for programmatic route discovery"
parentIssue: 1720
labels:
  - enhancement
  - agent-ux
assignees: []
milestone:
---

Counterfact already serves the OpenAPI document at `/counterfact/openapi` as YAML so Swagger UI can display it. However, AI agents need to consume the spec programmatically — as a JSON object — without knowing the original file path or performing a YAML-to-JSON conversion themselves.

The Admin API should expose the fully-resolved (bundle-dereferenced) spec as JSON at a stable, well-known endpoint so agents can discover all available routes, schemas, and response codes in a single HTTP call.

## Proposed change

Add a new read-only endpoint to the Admin API:

```
GET /_counterfact/api/openapi
```

Response: `Content-Type: application/json`, body is the bundled OpenAPI document as a plain JSON object (identical to what `openapiMiddleware` currently produces, but serialised as JSON instead of YAML).

Optionally, also add:

```
GET /_counterfact/api/openapi/paths              → just the `paths` object
GET /_counterfact/api/openapi/paths?route=<path> → schema for a single path item
                                                    (route is URL-encoded, e.g. route=%2Fpet%2F%7BpetId%7D)
```

The `route` query parameter avoids the routing ambiguity that would arise from embedding a slash-containing OpenAPI path into URL segments.

## Motivation

- The existing `/counterfact/openapi` endpoint is designed for Swagger UI, which accepts YAML. Agents prefer JSON and parse it without additional dependencies.
- The Admin API already acts as the programmatic interface; consolidating spec access there keeps the surface area consistent and auth-guarded.
- Agents building or testing against the mock server can dynamically enumerate valid paths, required parameters, and response schemas — enabling them to generate correct requests on the first attempt rather than guessing.

## Acceptance criteria

- [ ] `GET /_counterfact/api/openapi` returns `200 application/json` with the fully-resolved OpenAPI document
- [ ] The returned JSON matches the structure produced by `@apidevtools/json-schema-ref-parser`'s `bundle()` call
- [ ] `GET /_counterfact/api/openapi/paths` returns only the `paths` section of the spec
- [ ] The endpoint is protected by the same bearer-token / loopback guard as other admin API endpoints
- [ ] Returns `503` (or a clear error) when Counterfact was started without a spec (`openApiPath === "_"`)
- [ ] Unit tests cover the happy path, the paths sub-endpoint, and the no-spec case
