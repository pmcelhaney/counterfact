<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

**Your backend isn't ready. Your frontend can't wait. Counterfact closes the gap.**

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

Counterfact turns an [OpenAPI](https://www.openapis.org) spec into a stateful, TypeScript-native mock server in one command. Every endpoint is a `.ts` file you own and can edit live — with type safety, hot reload, and a live REPL.

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

> **Requires Node ≥ 22.0.0**

The patterns below describe the most common ways developers use Counterfact. Find the one that matches your situation and you'll be up and running in five minutes.

---

## Explore a new API

_You have a spec. You need to see it working before writing a line of code._

Every generated route returns random, schema-valid data immediately. Open the built-in Swagger UI, try every endpoint, and see real-shaped responses before touching any handler logic.

```ts
// api/routes/pet/{petId}.ts — generated, ready to use
export const GET: HTTP_GET = ($) => $.response[200].random();
```

→ [Full pattern: Explore a New API](./docs/patterns/explore-new-api.md)

---

## Mock with realistic data

_Random values are fine to start, but you need predictable, believable responses._

Replace `.random()` with `.json(...)`. TypeScript knows exactly what shapes are valid — the types come from your spec — so autocomplete shows you every valid field and JSDoc comments appear inline from your OpenAPI descriptions.

```ts
export const GET: HTTP_GET = ($) => {
  if ($.path.petId === 99) return $.response[404].text("Pet not found");
  return $.response[200].json({ id: $.path.petId, name: "Fluffy", status: "available", photoUrls: [] });
};
```

Save the file. The server reloads instantly without restarting or losing state.

→ [Full pattern: Mock APIs with Dummy Data](./docs/patterns/mock-with-dummy-data.md)

---

## Share state across routes

_Your POST and GET routes need to read and write the same data._

Create a `_.context.ts` file alongside your routes. Every handler in the directory receives the same shared instance — no database, no external process, just an in-memory TypeScript class.

```ts
// api/routes/_.context.ts
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
```

→ [Full pattern: Federated Context Files](./docs/patterns/federated-context.md)

---

## Simulate failures and edge cases

_You need to test what happens when the API returns 429, 503, or unexpected shapes._

Return any status code from any handler. Toggle responses from the REPL at runtime — no file edits, no restart.

```ts
export const GET: HTTP_GET = ($) => {
  if ($.context.rateLimitExceeded) {
    return $.response[429].text("Too Many Requests");
  }
  return $.response[200].json($.context.get($.path.petId));
};
```

```
⬣> context.rateLimitExceeded = true   // all subsequent requests now get 429
⬣> context.rateLimitExceeded = false  // back to normal
```

→ [Full pattern: Simulate Failures and Edge Cases](./docs/patterns/simulate-failures.md)

---

## Inspect and seed state with the live REPL

_You want to set up a scenario or check server state without writing a setup script._

The REPL runs in the same process as the server. It has direct access to the shared context and a typed HTTP client. No HTTP calls required to seed data — just assign it directly.

```
⬣> context.list()
[]

⬣> context.add({ name: "Fluffy", status: "available", photoUrls: [] })
{ id: 1, name: "Fluffy", status: "available", photoUrls: [] }

⬣> client.get("/pet/1")
{ status: 200, body: { id: 1, name: "Fluffy", ... } }
```

→ [Full pattern: Live Server Inspection with the REPL](./docs/patterns/repl-inspection.md)

---

## Proxy specific paths to the real backend

_Part of the API exists in production. You need the mock to fill in the rest._

Pass `--proxy-url` to forward unmatched requests. Toggle individual paths from the REPL at runtime.

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://api.example.com
```

```
⬣> .proxy on /payments     # /payments/* → real API
⬣> .proxy off              # all paths → mock
```

→ [Full pattern: Hybrid Proxy](./docs/patterns/hybrid-proxy.md)

---

## Run in automated tests

_You want a real HTTP server in CI — isolated per test, no shared state._

Import `startCounterfact` programmatically. Each test gets its own clean server instance with a fresh context.

```ts
import { startCounterfact } from "counterfact";

const { server, stop } = await startCounterfact({ openApiPath: "./openapi.yaml", basePath: "./api" });

afterAll(stop);

it("creates and fetches a pet", async () => {
  const post = await fetch("http://localhost:3100/pet", { method: "POST", body: JSON.stringify({ name: "Rex", photoUrls: [], status: "pending" }) });
  const created = await post.json();
  const get = await fetch(`http://localhost:3100/pet/${created.id}`);
  expect((await get.json()).name).toBe("Rex");
});
```

→ [Full pattern: Automated Integration Tests](./docs/patterns/automated-integration-tests.md)

---

## All patterns

| Pattern | When to use it |
|---|---|
| [Explore a New API](./docs/patterns/explore-new-api.md) | You have a spec but no running backend |
| [Executable Spec](./docs/patterns/executable-spec.md) | You want immediate feedback while designing the API |
| [Mock APIs with Dummy Data](./docs/patterns/mock-with-dummy-data.md) | You need believable responses for UI development or demos |
| [AI-Assisted Implementation](./docs/patterns/ai-assisted-implementation.md) | You want an AI agent to implement the handler logic |
| [Federated Context Files](./docs/patterns/federated-context.md) | You want each domain to own its state |
| [Test the Context, Not the Handlers](./docs/patterns/test-context-not-handlers.md) | You want unit tests for your stateful logic |
| [Live Server Inspection with the REPL](./docs/patterns/repl-inspection.md) | You want to seed data and toggle behavior without restarting |
| [Simulate Failures and Edge Cases](./docs/patterns/simulate-failures.md) | You need reproducible error conditions on demand |
| [Simulate Realistic Latency](./docs/patterns/simulate-latency.md) | You want to test under realistic response times |
| [Reference Implementation](./docs/patterns/reference-implementation.md) | You want a working, executable expression of API behavior |
| [Agentic Sandbox](./docs/patterns/agentic-sandbox.md) | You're building an AI agent and want to avoid rate limits |
| [Hybrid Proxy](./docs/patterns/hybrid-proxy.md) | Some endpoints exist in the real backend; others need mocking |
| [Automated Integration Tests](./docs/patterns/automated-integration-tests.md) | You want real HTTP tests in a CI-friendly test suite |
| [Custom Middleware](./docs/patterns/custom-middleware.md) | You need auth, headers, or logging across all routes |

---

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>
