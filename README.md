<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

### Generate a TypeScript mock server from an OpenAPI spec in seconds —<br>with stateful routes, hot reload, and a live REPL.

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

---

## Quick Start

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json mock-api
```

That's it. Counterfact reads your OpenAPI spec, generates TypeScript route files in `mock-api/`, and starts a mock server — all in one command. Point it at your own spec instead of the Petstore whenever you're ready.

> **Requires Node ≥ 17.0.0**

---

## Features

- ⚡ **Zero config** — one command to generate and start a mock server
- 🔒 **Type-safe by default** — route handlers are typed directly from your OpenAPI spec
- 🔄 **Hot reload** — edit route files while the server is running; state is preserved
- 🧠 **Stateful mocks** — POST data and GET it back; share state across routes with context objects
- 🖥 **Live REPL** — inspect and modify server state from your terminal without touching files
- 🔀 **Hybrid proxy** — route some paths to the real API while mocking others
- 🎲 **Smart random data** — uses OpenAPI examples and schema metadata to generate realistic responses
- 📖 **Built-in Swagger UI** — browse and test your mock API in a browser automatically
- 🔌 **Middleware support** — add custom middleware with `_.middleware.ts` files

---

## How It Works

1. **Generate** — Counterfact reads your OpenAPI spec and creates a `routes/` directory with a `.ts` file for each path, plus a `types/` directory with fully typed request/response interfaces.
2. **Customize** — Edit the route files to return exactly the data your frontend needs. The full power of TypeScript is at your disposal.
3. **Run** — The server hot-reloads on every save. No restart, no lost state.

---

## Examples

### Zero effort: random responses out of the box

Generated route files return random, schema-valid responses immediately — no editing required.

```ts
// mock-api/routes/store/order/{orderID}.ts
import type { HTTP_GET } from "../../../types/paths/store/order/{orderId}.types.js";

export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};
```

### Typed custom responses

Replace `.random()` with `.json()` to return specific data. TypeScript (via your IDE's autocomplete) guides you to a valid response.

```ts
import type { HTTP_GET } from "../../../types/paths/store/order/{orderId}.types.js";
import type { HTTP_DELETE } from "../../../types/paths/store/order/{orderId}.types.js";

export const GET: HTTP_GET = ($) => {
  const orders: Record<number, Order> = {
    1: { petId: 100, status: "placed" },
    2: { petId: 999, status: "approved" },
    3: { petId: 1234, status: "delivered" },
  };

  const order = orders[$.path.orderID];
  if (order === undefined) return $.response[404];
  return $.response[200].json(order);
};

export const DELETE: HTTP_DELETE = ($) => {
  return $.response[200];
};
```

### Stateful mocks with context

Use a `_.context.ts` file to share in-memory state across routes. POST data and GET it back, just like a real API.

```ts
// mock-api/routes/_.context.ts
export class Context {
  pets: Pet[] = [];

  addPet(pet: Pet) {
    const id = this.pets.length;
    this.pets.push({ ...pet, id });
    return this.pets[id];
  }

  getPetById(id: number) {
    return this.pets[id];
  }
}
```

```ts
// mock-api/routes/pet.ts
export const POST: HTTP_POST = ($) => {
  return $.response[200].json($.context.addPet($.body));
};

// mock-api/routes/pet/{petId}.ts
export const GET: HTTP_GET = ($) => {
  const pet = $.context.getPetById($.path.petId);
  if (!pet) return $.response[404].text(`Pet ${$.path.petId} not found.`);
  return $.response[200].json(pet);
};
```

---

## Key Capabilities

### 🔄 Hot Reload

Save a route file and the server picks it up instantly — no restart, no lost state. Your in-memory context survives every reload.

### 🖥 Live REPL

The REPL gives you a JavaScript prompt connected directly to your running server. Inspect state, trigger edge cases, or adjust proxy settings without touching a file.

```
⬣> context.pets.length
3
⬣> context.addPet({ name: "Fluffy", photoUrls: [] })
⬣> client.get("/pet/3")
⬣> .proxy on /payments    # forward /payments to the real API
⬣> .proxy off             # stop all proxying
```

### 🔀 Hybrid Proxy

Mock the paths that aren't ready yet while forwarding everything else to the real backend. See [Proxying](./docs/usage.md#proxy-peek-a-boo-) for details.

```sh
npx counterfact@latest openapi.yaml mock-api --proxy-url https://api.example.com
```

### 🔒 Type Safety

Every route handler is typed to match your OpenAPI spec. When the spec changes, regenerating the types surfaces any mismatches at compile time — before they become bugs.

```ts
// $.response, $.path, $.query, $.body, $.headers are all fully typed
export const GET: HTTP_GET = ($) => {
  return $.response[200]
    .header("x-request-id", $.headers["x-request-id"])
    .json({
      id: $.path.userId,
    });
};
```

---

## CLI Reference

```sh
npx counterfact@latest [openapi.yaml] [destination] [options]
```

| Option              | Description                                 |
| ------------------- | ------------------------------------------- |
| `--port <number>`   | Server port (default: `3100`)               |
| `-o, --open`        | Open browser automatically                  |
| `-g, --generate`    | Generate route and type files               |
| `-w, --watch`       | Generate and watch for spec changes         |
| `-s, --serve`       | Start the mock server                       |
| `-r, --repl`        | Start the interactive REPL                  |
| `--proxy-url <url>` | Forward all requests to this URL by default |
| `--prefix <path>`   | Base path prefix (e.g. `/api/v1`)           |

Run `npx counterfact --help` for the full list of options.

---

## Why Counterfact?

API-first development lets frontend and backend teams work in parallel against the same spec. In practice, there's always a corner of the backend that isn't finished — or a scenario that's a pain to reproduce in a shared environment. Counterfact fills that gap.

Built by an engineer who spent decades writing frontend code and got tired of being blocked by unfinished APIs. It's the fastest way to get unstuck, prototype ideas, and remember what it feels like to ship.

---

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>
