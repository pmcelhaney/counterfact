<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

---

# Counterfact — show, don't tell

> Requires Node ≥ 22.0.0

---

## Start

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

A server starts at `http://localhost:3100`. Every endpoint in the spec is live and returns random, schema-valid data. No code written yet.

---

## The generated file

```ts
// api/routes/pet/{petId}.ts  — generated, yours to edit
import type { HTTP_GET, HTTP_DELETE } from "../../types/paths/pet/{petId}.types.js";

export const GET: HTTP_GET = ($) => $.response[200].random();

export const DELETE: HTTP_DELETE = ($) => $.response[200].random();
```

---

## Return real data

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].json({
    id: $.path.petId,
    name: "Fluffy",
    status: "available",
    photoUrls: [],
  });
};
```

Save the file. The server picks it up immediately — no restart.

---

## Use an example from the spec

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].example("fullPet");
  //                              ^ autocompleted from your spec
};
```

---

## Return different responses by input

```ts
export const GET: HTTP_GET = ($) => {
  if ($.path.petId < 0) {
    return $.response[400].text("ID must be positive");
  }
  if ($.path.petId > 1000) {
    return $.response[404].text(`No pet with id ${$.path.petId}`);
  }
  return $.response[200].json({ id: $.path.petId, name: "Fluffy", status: "available", photoUrls: [] });
};
```

---

## Add state — POST data and GET it back

```ts
// api/routes/_.context.ts — shared state for all routes in this directory
import type { Pet } from "../types/components/pet.types.js";

export class Context {
  private pets = new Map<number, Pet>();
  private nextId = 1;

  add(data: Omit<Pet, "id">): Pet {
    const pet = { ...data, id: this.nextId++ };
    this.pets.set(pet.id, pet);
    return pet;
  }

  get(id: number): Pet | undefined {
    return this.pets.get(id);
  }

  list(): Pet[] {
    return [...this.pets.values()];
  }

  remove(id: number): void {
    this.pets.delete(id);
  }
}
```

```ts
// api/routes/pet.ts
import type { HTTP_GET, HTTP_POST } from "../types/paths/pet.types.js";

export const GET: HTTP_GET = ($) =>
  $.response[200].json($.context.list());

export const POST: HTTP_POST = ($) => {
  if (!$.body.name) return $.response[400].text("name is required");
  return $.response[200].json($.context.add($.body));
};
```

```ts
// api/routes/pet/{petId}.ts
import type { HTTP_GET, HTTP_DELETE } from "../../types/paths/pet/{petId}.types.js";

export const GET: HTTP_GET = ($) => {
  const pet = $.context.get($.path.petId);
  return pet
    ? $.response[200].json(pet)
    : $.response[404].text(`No pet with id ${$.path.petId}`);
};

export const DELETE: HTTP_DELETE = ($) => {
  $.context.remove($.path.petId);
  return $.response[200];
};
```

---

## Inspect and modify state from the REPL

```
⬣> context.list()
[ { id: 1, name: 'Fluffy', status: 'available', photoUrls: [] } ]

⬣> context.add({ name: 'Rex', status: 'pending', photoUrls: [] })
{ id: 2, name: 'Rex', status: 'pending', photoUrls: [] }

⬣> client.get("/pet/2")
{ status: 200, body: { id: 2, name: 'Rex', status: 'pending', photoUrls: [] } }

⬣> client.delete("/pet/1")
{ status: 200 }

⬣> context.list()
[ { id: 2, name: 'Rex', status: 'pending', photoUrls: [] } ]
```

---

## Forward some paths to a real backend

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://api.example.com
```

Toggle at runtime:

```
⬣> .proxy on /payments     # /payments/* → real API
⬣> .proxy off /payments    # /payments/* → mock again
⬣> .proxy off              # all paths → mock
```

---

## Add middleware

```ts
// api/routes/_.middleware.ts
import type { Middleware } from "koa";

const middleware: Middleware = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace("Bearer ", "");
  if (!token) { ctx.status = 401; return; }
  await next();
};

export default middleware;
```

---

## Read path, query, headers, and body

```ts
export const GET: HTTP_GET = ($) => {
  // Path parameter:    $.path.petId
  // Query parameter:   $.query.status
  // Request header:    $.headers["x-api-key"]
  // Request body:      $.body
  // Shared context:    $.context

  return $.response[200]
    .header("x-request-id", $.headers["x-request-id"] ?? "none")
    .json({ id: $.path.petId });
};
```

---

## CLI

```sh
# Generate files and start server (default behavior)
npx counterfact@latest openapi.yaml api

# Different port
npx counterfact@latest openapi.yaml api --port 4000

# Open browser automatically
npx counterfact@latest openapi.yaml api --open

# Proxy all unmatched requests upstream
npx counterfact@latest openapi.yaml api --proxy-url https://api.example.com

# Watch spec for changes and regenerate
npx counterfact@latest openapi.yaml api --watch

# Generate only, no server
npx counterfact@latest openapi.yaml api --generate

# Disable request validation
npx counterfact@latest openapi.yaml api --no-validate-request
```

---

## Learn more

- [Usage Guide](./docs/usage.md)
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md)

---

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>
