# Usage

Counterfact is three tools in one:

- a **code generator** that converts an [OpenAPI](https://support.smartbear.com/swaggerhub/docs/tutorials/openapi-3-tutorial.html) document to [TypeScript](https://www.typescriptlang.org/) route files
- a **mock server** optimized for front-end development workflows
- a **live REPL** for inspecting and manipulating server state at runtime

---

## Quick Start

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

This generates TypeScript route files under `api/` for the Swagger Petstore and starts the server. Swap in your own OpenAPI document URL (or local path) and change `api` to whatever directory you prefer.

> **Requires Node ≥ 17.0.0**

<details>
<summary>Full CLI reference</summary>

```
Usage: counterfact [options] [openapi.yaml] [destination]

Arguments:
  openapi.yaml               path or URL to OpenAPI document, or "_" to skip (default: "_")
  destination                path where code is generated (default: ".")

Options:
  --port <number>            server port (default: 3100)
  -o, --open                 open a browser after starting
  -g, --generate             generate route and type files
  --generate-types           generate types only
  --generate-routes          generate routes only
  -w, --watch                generate + watch for spec changes
  --watch-types              watch types only
  --watch-routes             watch routes only
  -s, --serve                start the mock server
  -r, --repl                 start the REPL
  --spec <string>            path or URL to OpenAPI document (alternative to positional argument)
  --proxy-url <string>       forward all unhandled requests to this URL
  --prefix <string>          base path prefix (e.g. /api/v1)
  --always-fake-optionals    include optional fields in random responses
  -b, --build-cache          pre-compile routes and types without starting the server
  -h, --help                 display help
```

</details>

<details>
<summary>Using with npm or yarn instead of npx</summary>

Pin a specific version by adding Counterfact as a dev dependency:

```json
"scripts": {
  "mock": "counterfact https://petstore3.swagger.io/api/v3/openapi.json api"
},
"devDependencies": {
  "counterfact": "^2.0.0"
}
```

Then run `npm run mock` or `yarn mock`. This ensures every developer on the team uses the same version.

</details>

<details>
<summary>Running in TypeScript native mode — no build step required</summary>

By default Counterfact pre-compiles your route files into a `.cache/` directory using the TypeScript compiler. If you run Counterfact under a TypeScript-aware runtime, it detects this automatically and skips compilation entirely — loading the `.ts` source files directly.

**With [tsx](https://tsx.is/) (recommended for simplicity)**

Install tsx as a dev dependency:

```sh
npm install --save-dev tsx
# or
yarn add --dev tsx
```

Then invoke `counterfact` via tsx:

```sh
npx tsx ./node_modules/counterfact/bin/counterfact.js openapi.yaml api --serve --watch
```

Or in `package.json`:

```json
"scripts": {
  "mock": "tsx ./node_modules/counterfact/bin/counterfact.js openapi.yaml api --serve --watch"
}
```

**With plain Node.js (Node 22.6+ required)**

Node's built-in `--experimental-strip-types` removes TypeScript type annotations without any extra dependency. A small loader included with Counterfact handles the `.js` → `.ts` import remapping that the TypeScript codebase relies on:

```sh
node \
  --experimental-strip-types \
  --import ./node_modules/counterfact/bin/register-ts-loader.mjs \
  ./node_modules/counterfact/bin/counterfact.js \
  openapi.yaml api --serve --watch
```

Or in `package.json`:

```json
"scripts": {
  "mock": "node --experimental-strip-types --import ./node_modules/counterfact/bin/register-ts-loader.mjs ./node_modules/counterfact/bin/counterfact.js openapi.yaml api --serve --watch"
}
```

> **Note:** `--experimental-strip-types` is stable enough for development use but the flag name may change before it graduates from experimental status.

</details>

---

## Generated Code

Counterfact generates two directories from your OpenAPI document:

- 📂 **`types/`** — fully typed request/response interfaces, auto-regenerated whenever the OpenAPI document changes. Don't edit these by hand.
- 📂 **`routes/`** — one TypeScript file per API path. These are yours to edit. Out of the box each file returns a random, schema-valid response. You can leave them as-is or customize as much as you like.

See [Generated Code FAQ](./faq-generated-code.md) for questions about source control, editing, and regeneration.

No OpenAPI document? See [using Counterfact without OpenAPI](./usage-without-openapi.md).

---

## Routes

Each file in `routes/` corresponds to an API path. For example, `/users/{userId}` maps to `routes/users/{userId}.ts`. The root path `/` maps to `routes/index.ts`.

A freshly generated route file looks like this:

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};

export const POST: HTTP_POST = ($) => {
  return $.response[200].random();
};
```

Each exported function handles one HTTP method. The single argument `$` gives you everything you need: request data, response builders, server state, and utilities.

> [!TIP]
> If you know Express, think of `$` as a type-safe combination of `req` and `res`.

### Building responses with `$.response`

`$.response` is a fluent builder for HTTP responses. Start by picking a status code, then chain one or more methods:

| Method                         | Description                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `.random()`                    | Returns random data generated from the OpenAPI schema (uses `examples` where available) |
| `.example(name)`               | Returns a specific named example from the OpenAPI spec                                  |
| `.json(content)`               | Returns a JSON body (also converts to XML automatically when the client requests it)    |
| `.text(content)`               | Returns a plain-text body                                                               |
| `.html(content)`               | Returns an HTML body                                                                    |
| `.xml(content)`                | Returns an XML body                                                                     |
| `.match(contentType, content)` | Returns a body with an explicit content type; chain multiple for content negotiation    |
| `.header(name, value)`         | Adds a response header                                                                  |

```ts
return $.response[200].header("x-request-id", "abc123").json({ ok: true });
```

#### Using named examples

If your OpenAPI spec defines named examples for a response, you can return a specific one by name using `.example()`. The name is autocompleted and type-checked — passing an unknown name is a compile error.

```ts
// Return a specific named example
return $.response[200].example("successResponse");

// Chain additional decorations after selecting an example
return $.response[200]
  .example("successResponse")
  .header("x-request-id", "abc123");
```

> [!TIP]
> Your IDE's autocomplete knows which status codes, headers, and response shapes are valid for each endpoint — based directly on your OpenAPI spec. If you omit a required header, TypeScript will tell you. When the spec changes and types are regenerated, TypeScript will surface any mismatches.

### Reading request data

The request is exposed through four typed properties:

| Property    | Contents                                                     |
| ----------- | ------------------------------------------------------------ |
| `$.path`    | Path parameters (e.g. `$.path.userId` for `/users/{userId}`) |
| `$.query`   | Query string parameters                                      |
| `$.headers` | Request headers                                              |
| `$.body`    | Request body                                                 |

```ts
export const GET: HTTP_GET = ($) => {
  if ($.headers["x-token"] !== "super-secret") {
    return $.response[401].text("Unauthorized");
  }

  const content =
    `Results for "${$.query.keyword}" in ${$.path.groupName}` +
    ` with tags: ${$.body.tags.join(", ")}`;

  return $.response[200].text(content);
};
```

All four objects are typed from your OpenAPI spec, so autocomplete works for parameter names and values.

### Basic auth: `$.auth`

When a request includes HTTP Basic credentials, they're available at `$.auth.username` and `$.auth.password`.

Support for other security schemes (API key, OAuth 2, OpenID Connect, mutual TLS) is planned. [Open an issue](https://github.com/pmcelhaney/counterfact/issues) to help prioritize.

### Simulating latency: `$.delay()`

Counterfact responds much faster than a real server. To test loading states and timeouts, use `$.delay()`:

```ts
// pause for exactly one second
await $.delay(1000);

// pause for a random duration between 1 and 5 seconds
await $.delay(1000, 5000);
```

### Escaping the type system: `$.x`

Counterfact translates your OpenAPI spec into strict TypeScript types. If your spec is incomplete, or you need to return something outside the spec (like a `500` error that isn't documented), the strict types can get in the way.

`$.x` is an alias for `$` with all types widened to `any`, giving you an escape hatch:

```ts
export const GET: HTTP_GET = ($) => {
  // header not defined in OpenAPI spec
  $.headers["my-undocumented-header"]; // TypeScript error
  $.x.headers["my-undocumented-header"]; // ok

  // status code not defined in OpenAPI spec
  return $.response[500].text("Error!"); // TypeScript error
  return $.x.response[500].text("Error!"); // ok
};
```

---

## State: Context Objects

<a id="context-object"></a>

The `$.context` object is how routes share in-memory state. It's an instance of the `Context` class exported from `_.context.ts` in the same directory (or the nearest parent directory that has one).

```ts
// routes/pet.ts
export const POST: HTTP_POST = ($) => {
  return $.response[200].json($.context.addPet($.body));
};

// routes/pet/{petId}.ts
export const GET: HTTP_GET = ($) => {
  const pet = $.context.getPetById($.path.petId);
  if (pet === undefined)
    return $.response[404].text(`Pet ${$.path.petId} not found.`);
  return $.response[200].json(pet);
};
```

Customize `_.context.ts` to hold whatever state and business logic your mock needs:

```ts
// routes/_.context.ts
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

> [!IMPORTANT]
> Keep context in memory. Counterfact is a development tool — starting fresh each time is a feature, not a bug. In-memory state also makes the server very fast.

For large APIs you can nest context objects. Any subdirectory can have its own `_.context.ts`. One context can access another via the `loadContext` function passed to its constructor:

```ts
// routes/users/_.context.ts
export class Context {
  constructor({ loadContext }) {
    this.rootContext = loadContext("/");
    this.petsContext = loadContext("/pets");
  }
}
```

### Loading JSON data with `readJson`

Use the `readJson` function (also passed to the constructor) to load static JSON data into your context. The path is resolved relative to the `_.context.ts` file.

```ts
// routes/_.context.ts
export class Context {
  private readonly readJson: (path: string) => Promise<unknown>;

  constructor({ readJson }: { readJson: (path: string) => Promise<unknown> }) {
    this.readJson = readJson;
  }

  async getSeeds() {
    return this.readJson("../mocks/seeds.json");
  }
}
```

---

## TypeScript Native Mode

By default Counterfact compiles your route files into a `.cache/` directory before loading them. When you run Counterfact under a TypeScript-aware runtime it detects this automatically and skips compilation, loading `.ts` source files directly. The result is the same hot-reload experience with no build step.

### How detection works

At startup Counterfact writes a small temporary TypeScript file to a system temp directory and attempts to import it. If the import succeeds the runtime is TypeScript-capable and the transpiler is skipped. No configuration is needed.

### With tsx

Invoke the `counterfact` binary through [tsx](https://tsx.is/):

```sh
# one-off via npx
npx tsx ./node_modules/counterfact/bin/counterfact.js openapi.yaml api --serve --watch

# or in package.json scripts
"mock": "tsx ./node_modules/counterfact/bin/counterfact.js openapi.yaml api --serve --watch"
```

tsx is available as a dev dependency (`npm install --save-dev tsx`).

### With plain Node.js

Node 22.6+ ships with `--experimental-strip-types`. A small module hook bundled with Counterfact (`bin/register-ts-loader.mjs`) adds the `.js` → `.ts` import remapping that Node doesn't do on its own:

```sh
node \
  --experimental-strip-types \
  --import ./node_modules/counterfact/bin/register-ts-loader.mjs \
  ./node_modules/counterfact/bin/counterfact.js \
  openapi.yaml api --serve --watch
```

In `package.json`:

```json
"scripts": {
  "mock": "node --experimental-strip-types --import ./node_modules/counterfact/bin/register-ts-loader.mjs ./node_modules/counterfact/bin/counterfact.js openapi.yaml api --serve --watch"
}
```

### What changes in native mode

|                     | Default (compiled)                     | Native TS                  |
| ------------------- | -------------------------------------- | -------------------------- |
| Startup             | Compiles routes to `.cache/` first     | Loads `.ts` files directly |
| `.cache/` directory | Created and managed automatically      | Not used                   |
| Dependencies        | None extra                             | tsx _or_ Node 22.6+        |
| Route file format   | Generated `.ts` files (same as always) | Same                       |
| Hot reload          | ✅                                     | ✅                         |

---

## Hot Reload 🔥

Save a file — any route or context file — and the running server picks it up immediately. No restart needed, and in-memory state is preserved across reloads.

This makes it fast to set up edge cases like:

- What does the UI do 8 clicks deep when the server returns a 500?
- What if there are zero results? What if there are 10,000?
- What if the server is slow?

Find the file corresponding to the route, change behavior by editing the TypeScript code, and continue testing.

Depending on the scenario, you may want to commmit your changes to source control or throw them away.

---

## REPL ⬣

The REPL is a JavaScript prompt connected directly to the running server — like the browser DevTools console, but for your mock API. After starting Counterfact you'll see:

```
____ ____ _  _ _ _ ___ ____ ____ ____ ____ ____ ___
|___ [__] |__| |\|  |  |=== |--< |--- |--| |___  |
            Storybook for the back-end

| API Base URL  ==> http://localhost:3100
| Admin Console ==> http://localhost:3100/counterfact/

⬣>
```

At the prompt you can interact with the live context:

```js
// add a single pet
context.addPet({ name: "Fluffy", photoUrls: [] });

// add 100 pets
for (let i = 0; i < 100; i++)
  context.addPet({ name: `Pet ${i}`, photoUrls: [] });

// query state
context.pets.filter((pet) => pet.name.startsWith("F"));
```

To access context from a subdirectory:

```js
const petsContext = loadContext("/pets");
```

The built-in `client` object lets you make HTTP requests from the prompt without leaving the terminal:

```js
client.get("/users");
client.post("/users", { name: "bob" });
client.put("/users/1", { name: "robert" }, { "x-api-version": "2" });
```

All standard HTTP methods are supported. Arguments are: path, body (where applicable), headers.

---

## Proxy 🔀

You can mix real backend calls with mocks — useful when some endpoints are not finished or you need to test edge cases like 500 errors.

To proxy a single endpoint from within a route file:

```ts
// routes/pet/{petId}.ts
export const GET: HTTP_GET = ($) => {
  return $.proxy("https://uat.petstore.example.com/pet");
};
```

To set a proxy for then entire API at runtime pass `--proxy-url` on the CLI:

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://uat.petstore.example.com
```

From the REPL, you can toggle proxying for the whole API or specific routes:

```
⬣> .proxy on /payments     # forward /payments to the real API
⬣> .proxy off /payments    # let Counterfact handle /payments
⬣> .proxy off              # stop proxying everything
```

Type `.proxy help` in the REPL for the full list of proxy commands.

---

## Middleware

Place a `_.middleware.ts` file in any `routes/` subdirectory to intercept requests and responses for that subtree. Middleware applies from the root down — a `_.middleware.ts` at the root runs for every request.

```ts
// routes/_.middleware.ts
export async function middleware($, respondTo) {
  const response = await respondTo($);
  return response.header("X-Custom-Header", "Custom Value");
}
```

`respondTo($)` passes the request to the next middleware layer or the route handler, and returns the response. You can modify `$` before calling `respondTo`, modify the response after, or both.

---

## Programmatic API

Counterfact can be used as a library — for example, from [Playwright](https://playwright.dev/) or [Cypress](https://www.cypress.io/) tests. This lets you manipulate context state directly in test code without relying on special magic values in mock logic.

```ts
import { counterfact } from "counterfact";

const config = {
  basePath: "./api", // directory containing your routes/
  openApiPath: "./api.yaml", // optional; pass "_" to run without a spec
  port: 8100,
  alwaysFakeOptionals: false,
  generate: { routes: false, types: false },
  proxyPaths: new Map(),
  proxyUrl: "",
  routePrefix: "",
  startAdminApi: false,
  startRepl: false, // do not auto-start the REPL
  startServer: true,
  watch: { routes: false, types: false },
};

const { contextRegistry, start } = await counterfact(config);
const { stop } = await start(config);

// Get the root context — the object your routes see as $.context
const rootContext = contextRegistry.find("/");
```

Once you have `rootContext` you can read and write any state that your route handlers expose.

### Example: parameterised auth scenario with Playwright

Given this route handler:

```ts
// routes/auth/login.ts
export const POST: HTTP_POST = ($) => {
  if ($.context.passwordResponse === "ok") return $.response[200];
  if ($.context.passwordResponse === "expired")
    return $.response[403].header("reason", "expired-password");
  return $.response[401];
};
```

A Playwright test can flip between scenarios without hard-coded usernames:

```ts
import { counterfact } from "counterfact";
import { chromium } from "playwright";

let page;
let rootContext;

let page;
let rootContext;
let stop;
let browser;

beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
  page = await (await browser.newContext()).newPage();

  const { contextRegistry, start } = await counterfact(config);
  ({ stop } = await start(config));
  rootContext = contextRegistry.find("/");
});

afterAll(async () => {
  await stop();
  await browser.close();
});

it("rejects an incorrect password", async () => {
  rootContext.passwordResponse = "incorrect";
  await attemptToLogIn();
  expect(await page.isVisible("#authentication-error")).toBe(true);
});

it("loads the dashboard on success", async () => {
  rootContext.passwordResponse = "ok";
  await attemptToLogIn();
  expect(await page.isVisible("#dashboard")).toBe(true);
});

it("prompts for a password change when the password has expired", async () => {
  rootContext.passwordResponse = "expired";
  await attemptToLogIn();
  expect(await page.isVisible("#password-change-form")).toBe(true);
});
```

### Return value of `counterfact()`

| Property          | Type                           | Description                                                                                                                  |
| ----------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `contextRegistry` | `ContextRegistry`              | Registry of all context objects keyed by path. Call `.find(path)` to get the context for a given route prefix.               |
| `registry`        | `Registry`                     | Registry of all loaded route modules.                                                                                        |
| `koaApp`          | `Koa`                          | The underlying Koa application.                                                                                              |
| `koaMiddleware`   | `Koa.Middleware`               | The Counterfact request-dispatch middleware.                                                                                 |
| `start(config)`   | `async (config) => { stop() }` | Starts the server (and optionally the file watcher and code generator). Returns a `stop()` function to gracefully shut down. |
| `startRepl()`     | `() => REPLServer`             | Starts the interactive REPL. Returns the REPL server instance.                                                               |

---

## What's Next

Please send feedback to pmcelhaney@gmail.com or [open an issue](https://github.com/pmcelhaney/counterfact/issues/new). [Contributions](../CONTRIBUTING.md) are always welcome.
