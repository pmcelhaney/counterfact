# Custom Middleware

Apply authentication, headers, logging, and other cross-cutting behavior once, across the routes that need it.

## Why teams use this

Handlers are a poor place for cross-cutting concerns. Adding an auth check, a CORS header, or a request log to every handler creates duplication, makes the handlers harder to read, and means that a new route will silently miss the concern unless the author remembers to add it.

## How it works

Drop a `_.middleware.ts` file into any directory in the routes tree. It exports a named Counterfact `middleware` function that applies to all routes in that subtree. Handlers in the subtree receive the request only after the middleware has run, so a rejected request never reaches a handler.

Place middleware close to the routes it governs. A `_.middleware.ts` at the root applies everywhere. One under `routes/admin/` applies only to admin endpoints.

The generated `Middleware` type lives in the matching directory under `types/`. Its `$` request and `respondTo($)` callback are Counterfact APIs; they are different from a Koa context and `next()`.

## Example

### Authentication gate

Reject unauthenticated requests before any handler runs:

```ts
// routes/_.middleware.ts
import type { Middleware } from "../types/_.middleware.js";

export const middleware: Middleware = async ($, respondTo) => {
  if (!$.headers.authorization) {
    return $.response[401].text("Unauthorized");
  }
  return respondTo($);
};
```

This example checks header presence only; add token validation for an authentication policy. All routes now require an `Authorization` header. A missing header returns `401` immediately — no handler is called.

### Adding response headers

Attach headers to every response in a subtree — useful for simulating CORS, rate-limit headers, or tracing identifiers:

```ts
// routes/_.middleware.ts
import { randomUUID } from "node:crypto";
import type { Middleware } from "../types/_.middleware.js";

export const middleware: Middleware = async ($, respondTo) => {
  const response = await respondTo($);
  return {
    ...response,
    headers: {
      ...("headers" in response ? response.headers : {}),
      "x-ratelimit-limit": "1000",
      "x-ratelimit-remaining": "999",
      "x-request-id": randomUUID(),
    },
  };
};
```

### Request logging

Log each matched route and its response status without touching any handler:

```ts
// routes/_.middleware.ts
import type { Middleware } from "../types/_.middleware.js";

export const middleware: Middleware = async ($, respondTo) => {
  const start = Date.now();
  const response = await respondTo($);
  const elapsed = Date.now() - start;
  const status = "status" in response ? response.status : undefined;
  console.log(`${$.matchedPath} → ${status ?? "default"} (${elapsed}ms)`);
  return response;
};
```

### Scoped middleware

Apply middleware only to a specific domain. The `_.middleware.ts` under `routes/admin/` fires for admin routes only; all other routes are unaffected:

```ts
// routes/admin/_.middleware.ts
import type { Middleware } from "../../types/admin/_.middleware.js";

export const middleware: Middleware = async ($, respondTo) => {
  const token = $.headers["x-admin-token"];
  if (token !== "super-secret") {
    return $.response[403].text("Forbidden");
  }
  return respondTo($);
};
```

## What you get

- Middleware applies automatically to every new route added to the subtree — no per-handler boilerplate is required.
- A single `_.middleware.ts` at the routes root applies to all paths; placing it in a subdirectory scopes it to that domain.
- Handlers remain focused on response logic; authentication, headers, and logging live in a separate file.
- Middleware uses onion-style composition: add logic before `respondTo($)` and inspect or modify its returned response afterward. Return a response from every branch.

## Keep exploring

- [Simulate Failures and Edge Cases](./simulate-failures.md) — middleware can reject or modify requests without touching handlers
- [Federated Context Files](./federated-context.md) — the same directory-scoping model applies to both context files and middleware files
- [Reference Implementation](./reference-implementation.md) — add middleware for the authentication and header outcomes consumers rely on
