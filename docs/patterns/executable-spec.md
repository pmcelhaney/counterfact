# Executable Spec

You have an OpenAPI spec and want to verify that clients conform to it, that handlers behave as intended, and that the two remain consistent — through automated tests and live validation.

## Problem

An OpenAPI spec is a static document. You cannot run it, test it, or know whether clients send conformant requests or servers return conformant responses until something fails at runtime.

## Solution

Pair the spec with Counterfact handlers to produce a running server that validates every request against the spec automatically and returns responses whose shapes are enforced by TypeScript at compile time. Run this server in CI using the programmatic API to turn the spec into a suite of automated conformance tests.

## Example

A spec operation and its handler together describe what the API should do:

```yaml
# openapi.yaml
paths:
  /greet:
    get:
      parameters:
        - name: name
          in: query
          required: true
          schema:
            type: string
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
```

```ts
// routes/greet.ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].json({ message: `Hello, ${$.query.name}!` });
};
```

Counterfact validates incoming requests against the spec. A request without the required `name` parameter returns `400` automatically — you write no validation code.

Use the programmatic API to start the server in a test suite and run real HTTP requests against it:

```ts
import { counterfact } from "counterfact";

const { start } = await counterfact("openapi.yaml", "api", {
  port: 4000,
  serve: true,
  repl: false,
});
const { stop } = await start();

const response = await fetch("http://localhost:4000/greet?name=World");
const body = await response.json();
assert.equal(body.message, "Hello, World!");

await stop();
```

Run with `--watch` during active spec design to regenerate types whenever the spec changes:

```sh
npx counterfact@latest openapi.yaml api --watch
```

Every time you save the spec, TypeScript re-checks all handlers against the new contract without a server restart.

## Consequences

- Request validation is spec-driven and automatic; you do not write schema validation logic in handlers.
- TypeScript enforces response conformance at compile time; a handler that returns the wrong shape will not compile.
- Tests written against the executable spec are integration tests, not unit tests — they exercise the full request/response cycle including parsing, routing, and handler logic.
- The spec and the handlers must be kept in sync manually for behavioral correctness; TypeScript only enforces structural conformance.

## Related Patterns

- [Reference Implementation](./reference-implementation.md) — build the handlers that make the spec executable
- [Simulate Failures and Edge Cases](./simulate-failures.md) — include error paths in the conformance test suite
- [Mock APIs with Dummy Data](./mock-with-dummy-data.md) — serve realistic data in tests that depend on response content
