<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

**Your backend isn't ready. Your frontend can't wait.**

**Counterfact turns your OpenAPI spec into a live, stateful API you can program in TypeScript.**

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

This is a five-minute walkthrough. By the end, you’ll have a **stateful, type-safe, hot-reloading API simulator** running locally—and you’ll understand why it’s different from traditional mock servers.

Built for frontend developers, test engineers, and AI agents that need a predictable API to work against.



## Minute 1 — Start the server

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

> **Requires Node ≥ 22.0.0**

That’s it.

Counterfact reads your spec, generates a TypeScript handler for every endpoint, and starts a server at `http://localhost:3100`.

Open `http://localhost:3100/counterfact/swagger/`.

Every endpoint is already live, returning random, schema-valid responses. No code written yet.



## Minute 2 — Make a route return real data

Open the generated file for `GET /pet/{petId}`:

```ts
import type { HTTP_GET } from "../../types/paths/pet/{petId}.types.js";

export const GET: HTTP_GET = ($) => $.response[200].random();
```

Replace `.random()` with your own logic:

```ts
export const GET: HTTP_GET = ($) => {
  if ($.path.petId === 99) {
    return $.response[404].text("Pet not found");
  }
  return $.response[200].json({
    id: $.path.petId,
    name: "Fluffy",
    status: "available",
    photoUrls: []
  });
};
```

Save the file. The server reloads instantly—no restart, no lost state.

TypeScript enforces the contract. If your response doesn’t match the spec, you’ll know before you make the request. 

## Minute 3 — Add state that survives across requests

Real APIs have memory. Yours should too.

Create `api/routes/_.context.ts`:

```ts
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

Use it in your routes:

```ts
export const GET: HTTP_GET = ($) => $.response[200].json($.context.list());
export const POST: HTTP_POST = ($) => $.response[200].json($.context.add($.body));
```

Now your API behaves like a real system:
- POST creates data
- GET returns it
- DELETE removes it

State survives hot reloads. Restarting resets everything—perfect for clean test runs.



## Minute 4 — Control the system at runtime (REPL)

This is where Counterfact becomes more than a mock.

The built-in REPL lets you inspect and control the system while it’s running.

Seed data:

```
⬣> context.add({ name: "Fluffy", status: "available", photoUrls: [] })
⬣> context.add({ name: "Rex", status: "pending", photoUrls: [] })
```

Make requests:

```
⬣> client.get("/pet/1")
```

Simulate failures instantly:

```
⬣> context.rateLimitExceeded = true
⬣> client.get("/pet/1")
{ status: 429, body: "Too Many Requests" }
```

No HTTP scripts. No restarts. Just direct control.



## Minute 5 — Proxy to the real backend

When parts of your backend are ready, forward them through.

Everything else stays simulated.

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://api.example.com
```

Toggle paths live:

```
⬣> .proxy on /payments
⬣> .proxy on /auth
⬣> .proxy off
```



## What you just built

In five minutes, you turned a static spec into a working system:

- **Schema-valid responses** from the moment it starts
- **Type-safe handlers** generated from your spec
- **Shared state** across all routes
- **Hot reloading** without losing that state
- A **live control surface (REPL)** for runtime behavior
- **Selective proxying** to real services



## Go deeper

| | |
|---|---|
| [Usage patterns](./docs/usage-patterns.md) | Failures, latency, AI sandboxes, integration tests |
| [Reference](./docs/reference.md) | `$` API, CLI flags, architecture |
| [How it compares](./docs/comparison.md) | json-server, WireMock, Prism, Microcks, MSW |
| [FAQ](./docs/faq.md) | State, types, regeneration |
| [Petstore example](https://github.com/counterfact/example-petstore) | Full working example |

<div align="center" markdown="1">

[Documentation](./docs/usage.md) · [Changelog](./CHANGELOG.md) · [Contributing](./CONTRIBUTING.md)

</div>