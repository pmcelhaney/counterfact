# Programmatic API

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

A Playwright test can flip between scenarios without hard-coded usernames:

```ts
import { counterfact } from "counterfact";
import { chromium } from "playwright";

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

## Return value of `counterfact()`

| Property          | Type                           | Description                                                                                                                  |
| ----------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `contextRegistry` | `ContextRegistry`              | Registry of all context objects keyed by path. Call `.find(path)` to get the context for a given route prefix.               |
| `registry`        | `Registry`                     | Registry of all loaded route modules.                                                                                        |
| `koaApp`          | `Koa`                          | The underlying Koa application.                                                                                              |
| `start(config)`   | `async (config) => { stop() }` | Starts the server (and optionally the file watcher and code generator). Returns a `stop()` function to gracefully shut down. |
| `startRepl()`     | `() => REPLServer`             | Starts the interactive REPL. Returns the REPL server instance.                                                               |

## See also

- [State](./state.md) — the context objects you manipulate from test code
- [Patterns: Automated Integration Tests](../patterns/automated-integration-tests.md) — using the programmatic API in a CI-friendly test suite
- [Reference](../reference.md) — CLI flags, architecture
- [Usage](../usage.md)
