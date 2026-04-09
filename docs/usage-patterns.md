# Usage Patterns

Counterfact supports a wide range of development workflows. This page walks through the most common ones, with concrete examples for each.

---

## Explore a new API

You have an OpenAPI spec — maybe from a vendor, a partner, or your own team's design — but you don't have production credentials yet, or the real service doesn't exist yet. You want to explore the API's surface area before committing to an integration.

```sh
npx counterfact@latest https://api.example.com/openapi.json api
```

Counterfact generates typed handlers for every endpoint and starts a server immediately. You don't write a single line of code. Every route returns random, schema-valid data by default.

From there you can:

- **Browse the API in Swagger UI** at `http://localhost:3100/counterfact/swagger/` — try requests, read descriptions, inspect schemas.
- **Send real requests** from your frontend, Postman, curl, or any HTTP client — the server is live.
- **Read the generated types** in `api/types/` to understand the exact request and response shapes before writing any integration code.
- **Use the REPL** to fire requests and inspect responses interactively:

  ```
  ⬣> client.get("/users/42")
  { status: 200, body: { id: 42, name: 'Alex', email: 'alex@example.com' } }
  ```

Because the server is entirely local and you control every response, you can explore safely without rate limits, costs, or risk of polluting production data.

---

## Simulate failures and edge cases

Real APIs fail. Network timeouts, 500 errors, rate limits, malformed payloads — these are easy to ignore during development and painful to discover in production. Counterfact makes edge cases trivially easy to reproduce.

### Return a specific error response

Open the route file for the endpoint you want to test and return the error you need:

```ts
// api/routes/payments/{paymentId}.ts
export const GET: HTTP_GET = ($) => {
  return $.response[503].text("Service temporarily unavailable");
};
```

Save the file. The server picks it up immediately — no restart. Your frontend or test suite sees the 503. When you're done testing, restore the original handler.

### Trigger edge cases from the REPL without touching files

Use the context to inject state that causes the route to behave differently:

```ts
// api/routes/_.context.ts
export class Context {
  isBroken = false;
  isRateLimited = false;
}
```

```ts
// api/routes/payments/{paymentId}.ts
export const GET: HTTP_GET = ($) => {
  if ($.context.isRateLimited) return $.response[429].text("Too Many Requests");
  if ($.context.isBroken) return $.response[500].text("Internal Server Error");
  return $.response[200].json({ id: $.path.paymentId, amount: 42.00 });
};
```

Now you can toggle failures from the REPL without editing a file:

```
⬣> context.isRateLimited = true
⬣> client.get("/payments/1")
{ status: 429, body: 'Too Many Requests' }

⬣> context.isRateLimited = false
⬣> context.isBroken = true
⬣> client.get("/payments/1")
{ status: 500, body: 'Internal Server Error' }
```

### Simulate intermittent failures

Return different responses depending on an internal counter:

```ts
export const GET: HTTP_GET = ($) => {
  $.context.callCount = ($.context.callCount ?? 0) + 1;
  if ($.context.callCount % 3 === 0) {
    return $.response[503].text("Flaky error");
  }
  return $.response[200].json({ id: $.path.petId });
};
```

Every third request fails. Adjust the logic for whatever pattern you need.

---

## Mock APIs with dummy data

You need realistic-looking data — not just random noise — to build a believable UI or to run a demo. Counterfact gives you several options.

### Random schema-valid data (zero effort)

The default generated handler returns random data that conforms to the spec:

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};
```

Strings are strings, numbers are numbers, required fields are always present. Use this when you just need something to render.

### Named examples from the spec

If your OpenAPI document defines named examples, return them by name:

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].example("fullPet");
  //                              ^ autocompleted from your spec
};
```

OpenAPI examples give you control over realistic values without duplicating them in handler code.

### Fixed data in the handler

Return exactly what your frontend needs:

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].json({
    id: $.path.petId,
    name: "Fluffy",
    status: "available",
    photoUrls: ["https://example.com/fluffy.jpg"],
  });
};
```

### Stateful CRUD — the full loop

Use a `_.context.ts` file to store data across requests, so POST, GET, PUT, and DELETE all work together:

```ts
// api/routes/_.context.ts
import type { Pet } from "../types/components/pet.types.js";

export class Context {
  private pets = new Map<number, Pet>();
  private nextId = 1;

  add(data: Omit<Pet, "id">): Pet {
    const pet = { ...data, id: this.nextId++ };
    this.pets.set(pet.id, pet);
    return pet;
  }

  get(id: number): Pet | undefined { return this.pets.get(id); }
  list(): Pet[] { return [...this.pets.values()]; }
  remove(id: number): void { this.pets.delete(id); }
}
```

```ts
// api/routes/pet.ts
export const GET: HTTP_GET = ($) => $.response[200].json($.context.list());
export const POST: HTTP_POST = ($) => $.response[200].json($.context.add($.body));

// api/routes/pet/{petId}.ts
export const GET: HTTP_GET = ($) => {
  const pet = $.context.get($.path.petId);
  return pet ? $.response[200].json(pet) : $.response[404].text("Not found");
};
export const DELETE: HTTP_DELETE = ($) => {
  $.context.remove($.path.petId);
  return $.response[200];
};
```

POST a pet. GET it back. Delete it and watch the 404 appear. The mock behaves like a real API because it is one — just running locally with TypeScript files you control.

---

## Fast, cheap sandbox for agentic coding

If you're building an AI agent that calls third-party APIs, running against a real service during development is expensive — rate limits hit quickly, errors are unpredictable, and every call costs money or counts against a quota.

Counterfact eliminates all of that.

### Start a local mock in seconds

```sh
npx counterfact@latest https://api.openai.com/openapi.yaml openai-mock
```

Your agent now calls `http://localhost:3100` instead of `https://api.openai.com`. Every response is instantaneous, deterministic, and free.

### Control exactly what the agent sees

Configure handlers to return the responses you want your agent to practice with:

```ts
// openai-mock/routes/v1/chat/completions.ts
export const POST: HTTP_POST = ($) => {
  return $.response[200].json({
    id: "chatcmpl-test",
    choices: [
      {
        message: {
          role: "assistant",
          content: "I can help you with that.",
        },
        finish_reason: "stop",
      },
    ],
  });
};
```

### Test how your agent handles failures

Swap the response to a rate limit error or a malformed payload — without waiting for the real API to fail:

```ts
export const POST: HTTP_POST = ($) => {
  return $.response[429].json({ error: { message: "Rate limit exceeded" } });
};
```

Save the file. The handler updates instantly. Test your agent's retry logic. Restore the original handler when you're done.

### Use the REPL to steer the agent mid-run

While your agent is running, change what the mock returns from the REPL — no restart needed:

```
⬣> context.simulateFailure = true
```

The agent's next request sees the failure. Your agent's error-handling code runs for real.

---

## Hybrid proxy

You have a real backend — maybe partially built, maybe already in production — and you want to mock some endpoints while forwarding others to the real service.

### Start with a proxy URL

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://api.example.com
```

All requests are forwarded to the real backend by default.

### Override specific paths with mocks

Edit the route file for any path you want to mock. Counterfact serves requests to that path from your handler; everything else still goes to the real backend.

```ts
// api/routes/payments.ts  — this path is now mocked
export const POST: HTTP_POST = ($) => {
  return $.response[200].json({ transactionId: "mock-txn-001" });
};
```

### Toggle proxy behavior at runtime from the REPL

You don't have to edit files. Use the REPL to switch paths between mock and real:

```
⬣> .proxy on /payments    # forward /payments/* to the real API
⬣> .proxy off /payments   # mock /payments/* again
⬣> .proxy off             # mock everything
```

This is useful when you want to debug a specific flow using real data for some paths and synthetic data for others — without touching any files.

### Typical use cases

- **Incremental migration**: Replace real endpoints with mocks as you refactor or decommission them.
- **Isolation testing**: Forward most traffic to production, but mock payment or notification endpoints to avoid side effects.
- **Frontend development**: Mock the endpoints that aren't ready yet; forward the ones that are.

---

## API reference implementation

Before you write the production service, use Counterfact to build a reference implementation from the spec. This gives you a working, spec-conformant server to:

- Validate that your API design is implementable and makes sense
- Unblock frontend teams while the production service is built
- Give QA engineers and API consumers something to test against
- Catch spec ambiguities before they become production bugs

### The workflow

1. Write the OpenAPI spec.
2. Run Counterfact to generate typed handlers.
3. Implement each handler to reflect the intended behavior.
4. Use this implementation as the canonical example of how the real service should behave.

### TypeScript keeps the implementation spec-conformant

Because every handler type is derived from the spec, TypeScript won't let you return a response that violates the contract:

```ts
export const POST: HTTP_POST = ($) => {
  // TypeScript error if body shape doesn't match the spec's request schema
  const pet = $.context.add($.body);

  // TypeScript error if response shape doesn't match the spec's response schema
  return $.response[200].json(pet);
};
```

Spec changes propagate automatically: regenerate types, and TypeScript surfaces every handler that no longer matches the updated contract — at compile time, before a single request fails.

### Use it as a contract for the real service

The handlers express the intended behavior of each operation. Development teams building the production service can read the handlers to understand edge cases, validation rules, and response shapes — without interpreting spec prose.

---

## Executable spec

An OpenAPI spec is a description. A Counterfact implementation is executable — it runs as a server, handles real requests, and can be tested automatically.

### The spec defines the contract; the handlers express the behavior

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

Together, the spec and the handler are a runnable, testable description of what the API should do.

### Validate the spec against real requests

Counterfact validates incoming requests against the spec by default. Requests that don't conform return a `400` automatically. This means running the executable spec acts as a conformance check for any client that calls it.

### Test the spec in CI

Use the programmatic API to start Counterfact in a test suite and run real HTTP requests:

```ts
import { counterfact } from "counterfact";

const { start } = await counterfact("openapi.yaml", "api", {
  port: 4000,
  serve: true,
  repl: false,
});
const { stop } = await start();

// Run real HTTP requests against http://localhost:4000
const response = await fetch("http://localhost:4000/greet?name=World");
const body = await response.json();
assert.equal(body.message, "Hello, World!");

await stop();
```

Every test call exercises the spec and the handler together. If the handler drifts from the spec, TypeScript catches it. If the behavior drifts from the intent, the test catches it.

### Hot reload keeps the spec live during design

Run with `--watch` to regenerate types whenever the spec changes:

```sh
npx counterfact@latest openapi.yaml api --watch
```

Edit the spec, save it, and your types update immediately. Your IDE reflects the new contract while the server is still running — no restart, no interruption.

---

## See also

- [Getting started](./getting-started.md) — step-by-step walkthrough from zero to a stateful mock
- [Reference](./reference.md) — `$` parameter, response builder, CLI flags, architecture
- [FAQ](./faq.md) — common questions about state, types, regeneration, and more
- [How it compares](./comparison.md) — side-by-side with json-server, WireMock, Prism, Microcks, MSW
- [Usage guide](./usage.md) — full documentation
