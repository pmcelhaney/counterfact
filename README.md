<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

---

**Counterfact instantly turns an [OpenAPI/Swagge](https://www.openapis.org) spec into a live, working API you can run locally.**

Instead of waiting for a backend—or wiring up brittle mocks—it generates a server where every endpoint is backed by TypeScript code. Responses are valid by default, but fully customizable, and the system is stateful, interactive, and hot-reloading.

It’s not just a mock server.

It’s a controllable API environment you can shape in real time.

> Built by Patrick McElhaney · Currently available for the right opportunity → https://patrickmcelhaney.org

---

## Quick Start

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

That's it. Counterfact reads your OpenAPI spec, generates TypeScript route files in `api/`, and starts a mock server — all in one command. Point it at your own spec instead of the Petstore whenever you're ready.

> **Requires Node ≥ 17.0.0**

---

## Features

- ⚡ **Zero config** — one command to generate and start a simulated api
- 🔒 **Type-safe by default** — route handlers are typed directly from your OpenAPI spec
- 🔄 **Hot reload** — edit route files while the server is running; state is preserved
- 🧠 **State management** — POST data and GET it back; share state across routes with context objects
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

### State management with plain old objects

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

You can also interact with the context object using a REPL. It's like DevTools on the server side. (See "Live REPL" below.)

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

## About the Author

Counterfact came out of a pattern I kept seeing: teams are slowed down more by coordination than by code.

I’ve spent 25+ years building software and improving how engineering organizations operate across large enterprises, regulated industries, and complex systems. Most of that time, the real constraint wasn’t technology—it was dependency and coordination.

Counterfact is one way of removing that friction.

I’m currently available — not for long.

→ https://patrickmcelhaney.org

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>
