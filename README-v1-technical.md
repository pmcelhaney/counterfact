<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

---

**Counterfact turns an OpenAPI spec into a stateful, TypeScript-native mock server — in one command.**

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

> **Requires Node ≥ 22.0.0**

---

## What It Does

Counterfact reads an [OpenAPI 3](https://www.openapis.org) document, generates a strongly-typed TypeScript route file for every path in the spec, and starts an HTTP server — all in one command. You can start serving real-looking data immediately, and customize any endpoint by editing its file while the server keeps running.

It is **not** a record/replay proxy, a schema validator, or a test harness. It is a programmable server you own and control.

---

## Installation

No installation required — use `npx`:

```sh
npx counterfact@latest <spec> <output-directory> [options]
```

Or install globally:

```sh
npm install -g counterfact
counterfact <spec> <output-directory>
```

---

## Architecture Overview

```
OpenAPI spec (YAML or JSON, local or URL)
        │
        ▼
┌──────────────────────┐
│  TypeScript Generator │  → routes/  (one .ts per path)
│                      │  → types/   (request/response interfaces)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Koa HTTP Server     │  → dispatches requests to route handlers
│  + Hot Reload        │  → watches for file changes via chokidar
│  + REPL              │  → interactive terminal attached to live state
│  + Proxy             │  → optional passthrough to a real backend
└──────────────────────┘
```

---

## Generated File Structure

```
<output-directory>/
├── routes/
│   ├── _.context.ts          # shared in-memory state (optional)
│   ├── _.middleware.ts        # custom Koa middleware (optional)
│   ├── pet.ts                 # handlers for /pet
│   ├── pet/
│   │   └── {petId}.ts         # handlers for /pet/{petId}
│   └── store/
│       └── order.ts
└── types/
    └── paths/
        ├── pet.types.ts
        ├── pet/
        │   └── {petId}.types.ts
        └── store/
            └── order.types.ts
```

---

## Route Handlers

Every generated route file exports a named function per HTTP method. The function receives a single `$` parameter that exposes everything from the request and a response builder typed to the spec.

### Default: random schema-valid response

```ts
// routes/pet/{petId}.ts
import type { HTTP_GET } from "../../types/paths/pet/{petId}.types.js";

export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};
```

### Custom JSON response

```ts
export const GET: HTTP_GET = ($) => {
  const pet = db.find($.path.petId);
  if (!pet) return $.response[404].text(`Pet ${$.path.petId} not found`);
  return $.response[200].json(pet);
};
```

### Named OpenAPI example

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].example("fullPet");
};
```

### The `$` parameter

| Property | Type | Description |
| --- | --- | --- |
| `$.path` | typed object | Path parameters from the URL |
| `$.query` | typed object | Query string parameters |
| `$.headers` | typed object | Request headers |
| `$.body` | typed object | Parsed request body |
| `$.context` | `Context` instance | Shared state for this route subtree |
| `$.response[N]` | response builder | Fluent builder for HTTP status N |

---

## State Management

Create a `_.context.ts` file anywhere in the routes tree. All route files in the same directory (and below) share the same `Context` instance.

```ts
// routes/_.context.ts
import type { Pet } from "../types/components/pet.types.js";

export class Context {
  private pets = new Map<number, Pet>();
  private nextId = 1;

  add(pet: Omit<Pet, "id">): Pet {
    const id = this.nextId++;
    const created = { ...pet, id };
    this.pets.set(id, created);
    return created;
  }

  get(id: number): Pet | undefined {
    return this.pets.get(id);
  }

  list(): Pet[] {
    return [...this.pets.values()];
  }

  remove(id: number): boolean {
    return this.pets.delete(id);
  }
}
```

```ts
// routes/pet.ts
export const GET: HTTP_GET = ($) => $.response[200].json($.context.list());
export const POST: HTTP_POST = ($) => $.response[200].json($.context.add($.body));

// routes/pet/{petId}.ts
export const GET: HTTP_GET = ($) => {
  const pet = $.context.get($.path.petId);
  return pet ? $.response[200].json(pet) : $.response[404];
};
export const DELETE: HTTP_DELETE = ($) => {
  $.context.remove($.path.petId);
  return $.response[200];
};
```

---

## Hot Reload

Counterfact watches the routes directory with [chokidar](https://github.com/paulmillr/chokidar). When you save a route file:

1. The module is re-imported.
2. The handler is swapped in the registry.
3. The `Context` instance **is preserved** — in-memory data survives the reload.

No restart required.

---

## Live REPL

The REPL runs in the terminal alongside the server. It connects directly to the live `Context` and route registry.

```
⬣> context.list()
[ { id: 1, name: 'Fluffy', status: 'available' } ]

⬣> context.add({ name: 'Rex', photoUrls: [], status: 'pending' })
{ id: 2, name: 'Rex', photoUrls: [], status: 'pending' }

⬣> client.get("/pet/1")
{ status: 200, body: { id: 1, name: 'Fluffy', status: 'available' } }

⬣> .proxy on /payments    # forward /payments/* to the real API
⬣> .proxy off             # disable all proxying
```

---

## Hybrid Proxy

Forward specific paths to a real backend while mocking the rest. Useful when only part of an API exists yet, or when you want to replace a few endpoints with custom behavior.

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://api.example.com
```

Toggle individual paths at runtime from the REPL (see above).

---

## Middleware

Drop a `_.middleware.ts` file into any routes subdirectory to inject Koa middleware for all routes in that subtree.

```ts
// routes/_.middleware.ts
import type { Middleware } from "koa";

const middleware: Middleware = async (ctx, next) => {
  ctx.set("x-powered-by", "counterfact");
  await next();
};

export default middleware;
```

---

## CLI Reference

```
npx counterfact@latest [spec] [output] [options]
```

| Flag | Default | Description |
| --- | --- | --- |
| `--port <n>` | `3100` | HTTP server port |
| `-o, --open` | `false` | Open browser on start |
| `-g, --generate` | `false` | Generate files and exit |
| `-w, --watch` | `false` | Regenerate on spec changes |
| `-s, --serve` | `false` | Start the server |
| `-r, --repl` | `false` | Start the REPL |
| `--spec <path>` | _(positional arg)_ | Path or URL to the OpenAPI document |
| `--proxy-url <url>` | _(none)_ | Default upstream for the proxy |
| `--prefix <path>` | _(none)_ | Global path prefix (e.g. `/api/v1`) |
| `--no-validate-request` | `false` | Skip OpenAPI request validation |

Run `npx counterfact@latest --help` for the full list.

---

## Swagger UI

Counterfact ships a built-in [Swagger UI](https://swagger.io/tools/swagger-ui/) at `http://localhost:3100/counterfact/`. Use it to browse endpoints and send test requests without any additional tooling.

---

## Type Safety

Route handler types are generated directly from the OpenAPI spec. When you regenerate after a spec change, TypeScript surfaces every handler that no longer matches the contract — at compile time, before anything breaks in production.

```ts
// This will fail to compile if status 200 no longer exists
// or if the response body shape changes.
export const GET: HTTP_GET = ($) => {
  return $.response[200].json({ id: $.path.petId, name: "Fluffy" });
};
```

---

## Admin API (for AI Agents and External Tools)

Counterfact exposes an HTTP Admin API at `/_counterfact/api/` that lets AI agents, test runners, and external tooling interact with the mock server in all the same ways a developer can through the REPL — without any human in the loop.

### Security

By default the Admin API is restricted to loopback connections (`127.0.0.1` / `::1`). To allow remote access, set an environment variable or pass a config option:

```sh
COUNTERFACT_ADMIN_API_TOKEN=my-secret-token npx counterfact@latest openapi.yaml api
```

Remote requests then require an `Authorization: Bearer my-secret-token` header.

### Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/_counterfact/api/health` | Server health, port, uptime |
| `GET` | `/_counterfact/api/routes` | All registered routes |
| `GET` | `/_counterfact/api/contexts` | All context paths and their current state |
| `GET` | `/_counterfact/api/contexts/<path>` | Current state of a specific context |
| `POST` | `/_counterfact/api/contexts/<path>` | Update a specific context (smart-merged) |
| `GET` | `/_counterfact/api/config` | Current server configuration |
| `GET` | `/_counterfact/api/config/proxy` | Current proxy configuration |
| `PATCH` | `/_counterfact/api/config/proxy` | Update proxy URL and/or per-path proxy toggles |

### Example: AI agent seeding state

An AI assistant helping a developer explore an API can use these endpoints to set up known state and then fire real HTTP requests to observe responses — all without touching the keyboard:

```sh
# Seed the pets context with known data
curl -X POST http://localhost:3100/_counterfact/api/contexts/pet \
  -H "Content-Type: application/json" \
  -d '{"pets": [{"id": 1, "name": "Fluffy", "status": "available"}]}'

# Fire a real API request and inspect the response
curl http://localhost:3100/pet/1
```

This makes Counterfact a powerful tool for LLM-powered developer assistants: the AI can load an OpenAPI spec, generate a running mock, probe endpoints, and explain the API's shape and behavior to the developer without touching the real service.

---

## Related Documentation

- [Usage Guide](./docs/usage.md)
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md)
- [FAQ: Generated Code](./docs/faq-generated-code.md)

---

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>
