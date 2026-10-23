# Automated Integration Tests

Run integration tests against a real local HTTP server that your test suite can start, shape, and tear down on demand.

## Why teams use this

Unit tests that mock HTTP calls at the library boundary (using `jest.mock()`, `vi.mock()`, or a fetch interceptor) do not exercise real HTTP behavior — headers, routing, content negotiation, middleware, or status code handling. Running tests against a real backend is slower, requires infrastructure, and produces non-deterministic results.

## How it works

Use Counterfact's programmatic API to embed the mock server directly in your test suite. Start it in a `beforeAll` hook, run every test against it, and stop it in `afterAll`. The server is entirely local, so tests are fast and deterministic. Handler files control exactly what the mock returns for each test scenario.

Install Counterfact as a dev dependency:

```sh
npm install --save-dev counterfact
```

Supplying `openApiPath` generates routes and types at startup, then watches the
spec for changes. Missing API directories are created automatically. To use
existing routes without regeneration, set both `generate` and `watch` to
`{ routes: false, types: false }`.

## Playwright: one simulator per worker

Install `@counterfact/playwright` and `@playwright/test` as development dependencies
in an ESM project. The adapter starts Counterfact once per worker and awaits
reset before every test. Select an optional scenario with `test.use()`:

```ts
import { createCounterfactTest, expect } from "@counterfact/playwright";

const test = createCounterfactTest({ basePath: "./api" });
test.use({ scenarioName: "emptyProjects" });

test("has no projects", async ({ request, simulatorURL }) => {
  expect(await (await request.get(`${simulatorURL}/projects`)).json()).toEqual(
    [],
  );
});
```

The complete [runnable Playwright example](https://github.com/counterfact/api-simulator/blob/7ab6e6a0ceb2bc2ffd2cb3eebf9107f1def8e05f/examples/playwright-reset/README.md)
includes configuration, routes, startup, fixture teardown, a per-test scenario
option, and assertions that deleted baseline data returns before the next test.
It uses Playwright's HTTP request fixture, so no browser installation is required.

The adapter gives each worker an isolated API source copy and compiled caches,
plus an OS-assigned port reported by `simulatorURL`. Tests on one worker share a
listener but reset before every test. Pass an existing extended Playwright test
as the factory's second argument to compose its fixtures. Use the `simulator`
fixture for direct store and context access. Await outstanding requests before reset;
requests arriving while reset runs receive 503. A failed reset keeps HTTP
unavailable until a later reset succeeds. Discard saved contexts and stores,
and reacquire them with `simulator.loadContext()` and `simulator.store` after
reset. See [Programmatic API](../features/programmatic-api.md) for full lifecycle
and failure semantics.

## Other test runners

The same lifecycle works with suite hooks:

```ts
import { counterfact } from "counterfact";

const config = { basePath: "api", openApiPath: "openapi.yaml", port: 4001 };
let simulator;
let stop;

beforeAll(async () => {
  simulator = await counterfact(config);
  ({ stop } = await simulator.start());
});

beforeEach(async () => {
  await simulator.reset();
});

afterAll(async () => {
  await stop();
});
```

See the [configuration options](../features/programmatic-api.md), apply named
scenarios with `await simulator.scenario(name)`, then send HTTP requests to the
configured port. Keep independently running tests on separate simulators.

## Keep exploring

- [Scenario Scripts](./scenario-scripts.md) — reusable state transformations
- [Share State Across API Groups](./shared-store.md) — one application store
- [Programmatic API](../features/programmatic-api.md) — lifecycle and reference rules
