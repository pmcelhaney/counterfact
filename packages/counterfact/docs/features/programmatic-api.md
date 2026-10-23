# Programmatic API

Counterfact can be used as a library — for example, from [Playwright](https://playwright.dev/) or [Cypress](https://www.cypress.io/) tests. This lets you manipulate context state directly in test code without relying on special magic values in mock logic.

Point Counterfact at an API directory, then start it:

```ts
import { counterfact } from "counterfact";

const api = await counterfact({ basePath: "api" });
const { stop } = await api.start();

// The same live context your routes see as $.context
const rootContext = api.contextRegistry.find("/");

// When the test suite finishes
await stop();
```

`basePath` is the only required option and can be relative to the current working
directory. Missing API, route, and required cache directories are created
automatically; an empty API starts successfully and returns 404 until routes are
added. By default, Counterfact serves existing routes on port **8100** without
loading an OpenAPI spec, starting a REPL, or enabling the Admin API. Runtime hot reload stays active until you call `stop()`.

Pass only the options you need to change:

```ts
const api = await counterfact({
  basePath: "api",
  openApiPath: "openapi.yaml", // generates routes/types and watches this spec
  port: 4001,
});
const { stop } = await api.start();
```

Generation, watching, and cache building are enabled by default, with or without
a spec. Supplying `openApiPath` generates routes and types at startup, watches
for spec changes, and enables spec-backed validation. Without a spec, there
are no spec-driven routes or types to generate. Generated handlers that use
`$.response[status].random()` or `.example(name)` require a supplied spec;
without it, the response definition is unavailable. To opt out, pass
`generate: { routes: false, types: false }`,
`watch: { routes: false, types: false }`, or `buildCache: false`.
`watch` controls regeneration; it does not disable runtime hot reload. Other runtime
options remain available as overrides. Each simulator gets its own proxy map. `buildCache` enables a one-time cache
build when `startServer` is false; a running server compiles and reloads routes
as needed regardless of that flag.

`start()` reuses the configuration passed to `counterfact()`. Pass partial
startup overrides to change the port or startup controls while retaining defaults:

```ts
const { stop } = await api.start({ port: 8111 });
console.log(api.status().address?.port); // 8111
```

`port`, `startServer`, `buildCache`, `generate`, and `watch` can be overridden.
Existing calls that pass a full configuration to `counterfact(config)` and `start(config)` remain
supported. In the examples below, `config` can be a minimal object such as
`{ basePath: "api" }`.

Once you have `rootContext` you can read and write any state that your route handlers expose.

## Checking server status

Call `api.status()` for the resolved API directory and a snapshot of the HTTP listener:

```ts
const api = await counterfact({ basePath: "api", port: 0 });
api.status().basePath; // "/absolute/path/to/api"
api.status().listening; // false

const { stop } = await api.start();
const status = api.status();
if (status.listening && status.address) {
  console.log(`Counterfact is listening on port ${status.address.port}`);
}

await stop();
api.status().basePath; // "/absolute/path/to/api"
api.status().listening; // false
```

`basePath` is the absolute API directory containing `routes/`, resolved relative
to the working directory when `counterfact()` is called. It remains available
before startup, after shutdown, and when the HTTP server is disabled.

The snapshot also includes resolved configuration: `port`, `openApiPath`,
`prefix`, `generate`, `watch`, `buildCache`, server/REPL/Admin API flags,
validation settings, overlays, and proxy settings. Explicit startup options are
reflected after calling `start(options)`. The configured `port` can be `0`;
`address.port` is the actual allocated port. The Admin API token is omitted.
Objects, arrays, and maps are copied so editing a snapshot does not change the
simulator's configuration.

`address` contains the bound address, address family, and actual port, including
an automatically assigned port when configured with `port: 0`. `start()` waits
until the listener is ready and rejects if binding fails, such as when the port
is already occupied. With `startServer: false`, `listening` remains `false` and
`address` remains `null`. This reports the local HTTP listener;
it does not probe application routes or upstream services.

## Accessing an application-level store

If `<basePath>/_.store.ts` exists, `counterfact()` constructs one shared store
for the simulator and exposes it through the optional `store` property. Supply
the user-authored store type as the generic argument when you want typed access:

```ts
import { counterfact } from "counterfact";
import type { Store } from "./api/_.store.js";

const simulator = await counterfact<Store>(config, specs);

if (simulator.store === undefined) {
  throw new Error("Expected api/_.store.ts to be loaded");
}

simulator.store.seed();
const { stop } = await simulator.start();
```

The property remains optional because the published API cannot infer whether a
caller-local file exists. The object is the same live store used by every API
group's context constructors and by the REPL. It is available before `start()`
when discovered during simulator construction.

## Example: parameterised auth scenario with Playwright

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

A Playwright Test suite can change the live context before each login attempt.
Here, `attemptToLogIn(page)` is your application's login helper:

```ts
import { test, expect } from "@playwright/test";
import { counterfact } from "counterfact";
import { attemptToLogIn } from "./support/login.js";

let api: Awaited<ReturnType<typeof counterfact>>;
let stop: () => Promise<void>;

// These tests deliberately share one server and its mutable context.
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  api = await counterfact({ basePath: "api" });
  ({ stop } = await api.start());
});

test.afterAll(async () => {
  await stop?.();
});

test("rejects an incorrect password", async ({ page }) => {
  api.contextRegistry.find("/").passwordResponse = "incorrect";
  await attemptToLogIn(page);
  await expect(page.locator("#authentication-error")).toBeVisible();
});

test("loads the dashboard on success", async ({ page }) => {
  api.contextRegistry.find("/").passwordResponse = "ok";
  await attemptToLogIn(page);
  await expect(page.locator("#dashboard")).toBeVisible();
});

test("prompts for a password change when the password has expired", async ({
  page,
}) => {
  api.contextRegistry.find("/").passwordResponse = "expired";
  await attemptToLogIn(page);
  await expect(page.locator("#password-change-form")).toBeVisible();
});
```

Configure your application to send API requests to `http://localhost:8100`. This
example uses one serial suite; parallel workers need separate server ports and
application API URLs so they do not share a listener or mutable state.

## Multiple specs / versioned APIs

Pass a `specs` array as the second argument to `counterfact()` to host several API specs on the same server. Each entry is a `SpecConfig` object:

| Field     | Type            | Description                                                                                   |
| --------- | --------------- | --------------------------------------------------------------------------------------------- |
| `source`  | `string`        | Path or URL to the OpenAPI document (`"_"` to run without a spec).                            |
| `group`   | `string`        | Generated-code subdirectory and runtime state key. It does not change URLs.                   |
| `version` | `string` (opt.) | Version label (e.g. `"v1"`) used for generated version types and grouped handler state.       |
| `prefix`  | `string` (opt.) | URL prefix prepended to every path in the spec. When omitted, it defaults to `""` (the root). |

### Groups and URL prefixes

`group` controls where code is generated under `config.basePath` and which
runners share state. It never changes a path declared by the OpenAPI document.
Only `prefix` affects the effective URL:

| Declared OpenAPI path | `prefix`        | Effective URL       |
| --------------------- | --------------- | ------------------- |
| `/customers`          | omitted or `""` | `/customers`        |
| `/customers`          | `/api`          | `/api/customers`    |
| `/customers`          | `/api/v1`       | `/api/v1/customers` |

Several specs may use the same prefix, including the root. Counterfact tries
matching runners in declaration order, so grouped specs with distinct paths
can preserve their canonical URLs:

```ts
const { start } = await counterfact(config, [
  { source: "./customers.yaml", group: "customers" },
  { source: "./products.yaml", group: "products" },
]);

await start();
// /customers from customers.yaml is served at /customers.
// /products from products.yaml is served at /products.
```

### Example — serving two versions of the same API

```ts
import { counterfact } from "counterfact";

const { start } = await counterfact(config, [
  {
    source: "./api-v1.yaml",
    group: "my-api",
    version: "v1",
    prefix: "/api/v1",
  },
  {
    source: "./api-v2.yaml",
    group: "my-api",
    version: "v2",
    prefix: "/api/v2",
  },
]);

await start();
// Routes are now available at:
//   http://localhost:8100/api/v1/...
//   http://localhost:8100/api/v2/...
```

Use any explicit prefix that matches the API's public URL structure:

```ts
const { start } = await counterfact(config, [
  { source: "./api.yaml", group: "my-api", version: "v1", prefix: "/legacy" },
]);
// Routes are served at /legacy/...; group/version still control code and state.
```

## Return value of `counterfact()`

| Property          | Type                             | Description                                                                                                                     |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `status()`        | `() => CounterfactStatus`        | Returns the absolute API directory, current HTTP listening state, and bound address.                                            |
| `contextRegistry` | `ContextRegistry`                | Registry of all context objects keyed by path. Call `.find(path)` to get the context for a given route prefix.                  |
| `registry`        | `Registry`                       | Registry of all loaded route modules.                                                                                           |
| `koaApp`          | `Koa`                            | The underlying Koa application.                                                                                                 |
| `store`           | `TStore \| undefined`            | Optional application-level store loaded from `<basePath>/_.store.ts`. Supply `TStore` to `counterfact<TStore>()`.               |
| `start(options?)` | `async (options?) => { stop() }` | Merges partial startup overrides into the initial configuration and waits for the listener. Returns an awaited `stop()` handle. |
| `startRepl()`     | `() => REPLServer`               | Starts the interactive REPL. Returns the REPL server instance.                                                                  |

## See also

- [State](./state.md) — the context objects you manipulate from test code
- [Patterns: Share State Across API Groups](../patterns/shared-store.md) — typed shared state for multi-API simulations
- [Patterns: Automated Integration Tests](../patterns/automated-integration-tests.md) — using the programmatic API in a CI-friendly test suite
- [Reference](../reference.md) — CLI flags, architecture
- [Usage](../usage.md)
