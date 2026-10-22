# Programmatic API

Counterfact can be used as a library — for example, from [Playwright](https://playwright.dev/) or [Cypress](https://www.cypress.io/) tests. This lets you manipulate context state directly in test code without relying on special magic values in mock logic.

Point Counterfact at an existing API directory, then start it:

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
directory. By default, Counterfact serves existing routes on port **8100** without
loading an OpenAPI spec, generating files, starting a REPL, or enabling the Admin
API. Runtime hot reload stays active until you call `stop()`.

Pass only the options you need to change:

```ts
const api = await counterfact({
  basePath: "api",
  openApiPath: "openapi.yaml", // optional: enables spec-backed validation and docs
  port: 4001,
});
const { stop } = await api.start();
```

Request and response validation are enabled when a spec is supplied. Generation,
cache building, and spec-driven regeneration are off by default. To generate routes
or types during startup, opt in with `generate: { routes: true, types: true }`.
`watch` controls regeneration; it does not disable runtime hot reload. Other runtime
options remain available as overrides. Each simulator gets its own proxy map.

`start()` reuses the configuration passed to `counterfact()`. Existing calls that
pass a full configuration to `counterfact(config)` and `start(config)` remain
supported. In the examples below, `config` can be a minimal object such as
`{ basePath: "api" }`.

Once you have `rootContext` you can read and write any state that your route handlers expose.

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

| Property          | Type                             | Description                                                                                                       |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `contextRegistry` | `ContextRegistry`                | Registry of all context objects keyed by path. Call `.find(path)` to get the context for a given route prefix.    |
| `registry`        | `Registry`                       | Registry of all loaded route modules.                                                                             |
| `koaApp`          | `Koa`                            | The underlying Koa application.                                                                                   |
| `store`           | `TStore \| undefined`            | Optional application-level store loaded from `<basePath>/_.store.ts`. Supply `TStore` to `counterfact<TStore>()`. |
| `start(options?)` | `async (options?) => { stop() }` | Starts using the initial configuration unless startup options are supplied. Returns an awaited `stop()` handle.   |
| `startRepl()`     | `() => REPLServer`               | Starts the interactive REPL. Returns the REPL server instance.                                                    |

## See also

- [State](./state.md) — the context objects you manipulate from test code
- [Patterns: Share State Across API Groups](../patterns/shared-store.md) — typed shared state for multi-API simulations
- [Patterns: Automated Integration Tests](../patterns/automated-integration-tests.md) — using the programmatic API in a CI-friendly test suite
- [Reference](../reference.md) — CLI flags, architecture
- [Usage](../usage.md)
