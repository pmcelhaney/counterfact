# Reference Implementation

You have an OpenAPI spec and want a working, executable implementation that serves as the canonical example of how the API should behave — before the production service exists, or alongside it.

## Problem

An OpenAPI spec describes the structure of an API but not its behavior. Teams building the production service, writing tests, or consuming the API have to interpret spec prose to understand what should happen in each situation. Misinterpretations accumulate silently until something breaks in production.

## Solution

Implement every route handler in Counterfact to reflect the intended behavior of the API. TypeScript types derived from the spec make it impossible to return a response that violates the contract. The result is an executable, testable artifact that expresses the API's behavior in code, not prose — and stays synchronized with the spec automatically.

## Example

Write the OpenAPI spec, then generate and implement the handlers:

```sh
npx counterfact@latest openapi.yaml api
```

Implement each handler with the intended behavior:

```ts
// api/routes/pet.ts
export const POST: HTTP_POST = ($) => {
  if (!$.body.name) return $.response[400].text("name is required");
  const pet = $.context.add($.body);
  return $.response[200].json(pet);
};
```

TypeScript catches contract violations at compile time:

```ts
// This fails to compile if the response shape no longer matches the spec.
return $.response[200].json(pet);
```

When the spec changes, regenerate the types:

```sh
npx counterfact@latest openapi.yaml api --generate-types
```

TypeScript immediately surfaces every handler that no longer matches the updated contract. Fix those handlers, and the reference implementation is up to date.

## Consequences

- The implementation is a living document: it compiles against the spec and fails loudly when they diverge.
- Teams building the production service can read the handlers to understand expected behavior, including validation rules and edge cases, without interpreting prose.
- The implementation is not a substitute for the production service — it runs in-memory, has no persistence, and is not hardened for production traffic.
- Keeping the reference implementation accurate requires discipline: handlers that drift from intent without violating the schema will not be caught by TypeScript alone.

## Related Patterns

- [Mock APIs with Dummy Data](./mock-with-dummy-data.md) — the starting point; a reference implementation adds meaningful logic on top
- [Executable Spec](./executable-spec.md) — use the reference implementation as the basis for contract tests
- [Hybrid Proxy](./hybrid-proxy.md) — replace the reference implementation path-by-path as the production service comes online
