# Request and response validation

Validation helps reveal mismatches between traffic and a loaded OpenAPI contract. Generated TypeScript types guide handler authors; runtime validation examines supported parts of actual traffic.

## Keep validation enabled

Request and response validation are enabled by default. Start the simulator with a specification, send a valid request, then omit a required input and inspect the response. Request validation checks required query, header, and cookie parameters and validates supported request-body schemas. Invalid requests are rejected with 400 before the handler runs.

## Understand response checks

Response validation currently checks declared response headers, including required headers and their schemas. It does **not** perform general response-body schema validation. An undeclared response status with no applicable default response is not rejected merely for being undeclared. Streaming content is not a promise of item-by-item runtime schema validation.

When supported response checks fail, the server adds `response-type-error` headers and keeps the handler’s status and body. Do not treat these checks as a complete OpenAPI conformance suite.

## Disable checks for a deliberate experiment

```sh
npx counterfact ./openapi.yaml api --no-validate-request --no-validate-response
```

From code, pass `validateRequests: false` or `validateResponses: false`. These flags are independent of `$.x`, which widens TypeScript types but does not itself turn validation off.

Without a specification there is no operation contract to validate against. See [CLI configuration](../api/cli.md) and [handler arguments](../api/handlers.md).
