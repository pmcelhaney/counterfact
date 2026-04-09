# Explore a New API

You have an OpenAPI spec but not yet production access, credentials, or a running backend. You want to understand the API's shape and behavior before committing to an integration.

## Problem

You cannot call the real API — it isn't running, you lack credentials, or calling it has side effects you want to avoid. Yet you need to understand the API well enough to start building against it.

## Solution

Point Counterfact at the OpenAPI spec. It generates typed TypeScript handlers for every endpoint and starts a live server immediately, with no code to write. Every route returns random, schema-valid responses by default. Use the running server, the generated types, Swagger UI, and the REPL to explore the API's surface area safely and cheaply.

## Example

```sh
npx counterfact@latest https://api.example.com/openapi.json api
```

Browse the API in Swagger UI at `http://localhost:3100/counterfact/swagger/`, or fire requests directly from the REPL:

```
⬣> client.get("/users/42")
{ status: 200, body: { id: 42, name: 'Alex', email: 'alex@example.com' } }
```

Read the generated types in `api/types/` to understand exact request and response shapes before writing any integration code. Every field, parameter, and status code defined in the spec is represented there.

## Consequences

- The server is entirely local, so there are no rate limits, costs, or risk of polluting production data.
- Responses are randomly generated from the spec schema — they conform structurally but carry no meaningful data until you customize handlers.
- If the spec is incomplete or inaccurate, the mock reflects those gaps.

## Related Patterns

- [Mock APIs with Dummy Data](./mock-with-dummy-data.md) — once you've explored the API, customize handlers to return realistic data
- [Simulate Failures and Edge Cases](./simulate-failures.md) — explore error paths without triggering them in the real system
- [Hybrid Proxy](./hybrid-proxy.md) — explore a real backend while mocking the paths that aren't ready
