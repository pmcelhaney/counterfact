<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

**Your backend isn't ready. Your frontend can't wait. Counterfact closes the gap.**

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

This is a five-minute walkthrough. By the end you will have a stateful, type-safe, hot-reloading mock server running locally — and you'll understand what makes it different from every other mocking tool.

---

## Minute 1 — Start the server

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

> **Requires Node ≥ 22.0.0**

That's the whole setup. Counterfact reads the spec, generates a typed TypeScript route file for every endpoint in the spec, and starts a server at `http://localhost:3100`.

Open `http://localhost:3100/counterfact/swagger/` in your browser. Every endpoint is already live and returning random, schema-valid responses. No code written yet.

---

## Minute 2 — Make a route return real data

Open the generated file for `GET /pet/{petId}`:

```ts
// api/routes/pet/{petId}.ts — generated, yours to edit
import type { HTTP_GET } from "../../types/paths/pet/{petId}.types.js";

export const GET: HTTP_GET = ($) => $.response[200].random();
//                                                  ^ random schema-valid response
```

Replace `.random()` with your own response:

```ts
export const GET: HTTP_GET = ($) => {
  if ($.path.petId === 99) {
    return $.response[404].text("Pet not found");
  }
  return $.response[200].json({ id: $.path.petId, name: "Fluffy", status: "available", photoUrls: [] });
};
```

Save the file. The server reloads the handler **immediately** — no restart, no lost data. Try the endpoint again; it returns your response.

TypeScript already knows every valid response shape because the types were generated from the spec. If you return a field that doesn't belong, or forget a required one, the editor tells you before you even make the request.

---

## Minute 3 — Add state that survives across requests

Real APIs have memory. Your mock should too.

Create `api/routes/_.context.ts` — a shared class that every route handler in the directory can read and write:

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

Wire it into your route handlers through `$.context`:

```ts
// api/routes/pet.ts
export const GET: HTTP_GET = ($) => $.response[200].json($.context.list());
export const POST: HTTP_POST = ($) => $.response[200].json($.context.add($.body));

// api/routes/pet/{petId}.ts
export const GET: HTTP_GET = ($) => {
  const pet = $.context.get($.path.petId);
  return pet ? $.response[200].json(pet) : $.response[404].text(`No pet ${$.path.petId}`);
};
export const DELETE: HTTP_DELETE = ($) => {
  $.context.remove($.path.petId);
  return $.response[200].random();
};
```

POST a pet. GET it back. DELETE it. POST another. The state survives every hot reload. Restarting the server resets it to a clean state — which is exactly what you want between test runs.

---

## Minute 4 — Use the live REPL

The server also opens a REPL — a JavaScript prompt wired directly into the running process. No HTTP calls, no scripts, just direct access.

Seed data:

```
⬣> context.add({ name: "Fluffy", status: "available", photoUrls: [] })
{ id: 1, name: "Fluffy", status: "available", photoUrls: [] }

⬣> context.add({ name: "Rex", status: "pending", photoUrls: [] })
{ id: 2, name: "Rex", status: "pending", photoUrls: [] }
```

Fire a request:

```
⬣> client.get("/pet/1")
{ status: 200, body: { id: 1, name: "Fluffy", status: "available", photoUrls: [] } }
```

Simulate a failure condition without touching any file:

```
⬣> context.rateLimitExceeded = true
⬣> client.get("/pet/1")
{ status: 429, body: "Too Many Requests" }
```

---

## Minute 5 — Proxy to the real backend

When parts of the real API are ready, forward them through instead of mocking them. Everything else stays mocked.

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://api.example.com
```

Toggle individual paths from the REPL without restarting:

```
⬣> .proxy on /payments     # /payments/* → real API
⬣> .proxy on /auth         # /auth/* → real API
⬣> .proxy off              # all paths → mock again
```

---

## What you just built

In five minutes you went from a spec to a server that:

- Returns **schema-valid responses** from the moment it starts
- Uses **real TypeScript logic** you control, with types enforced by your spec
- **Shares state** across all routes through a single in-memory context
- **Hot-reloads** your handler changes without losing that state
- Gives you a **live REPL** to inspect, seed, and control the server at runtime
- Can **proxy** specific paths to the real API while mocking everything else

---

## Go deeper

| | |
|---|---|
| [Usage patterns](./docs/usage-patterns.md) | Fourteen patterns: failures, latency, AI sandboxes, integration tests, and more |
| [Reference](./docs/reference.md) | Full `$` parameter API, CLI flags, and architecture diagram |
| [How it compares](./docs/comparison.md) | Side-by-side with json-server, WireMock, Prism, Microcks, and MSW |
| [FAQ](./docs/faq.md) | Common questions about state, types, regeneration, and middleware |
| [Petstore example](https://github.com/counterfact/example-petstore) | A complete, fully implemented example you can clone and run |

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>
