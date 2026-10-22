# Automated Integration Tests

Run integration tests against a real local HTTP server that your test suite can start, shape, and tear down on demand.

## Why teams use this

Unit tests that mock HTTP calls at the library boundary (using `jest.mock()`, `vi.mock()`, or a fetch interceptor) do not exercise real HTTP behavior — headers, routing, content negotiation, middleware, or status code handling. Running tests against a real backend is slower, requires infrastructure, and produces non-deterministic results.

## How it works

Use Counterfact's programmatic API to embed the mock server directly in your test suite. Start it in a `beforeAll` hook, run every test against it, and stop it in `afterAll`. The server is entirely local, so tests are fast and deterministic. Handler files control exactly what the mock returns for each test scenario.

## Playwright: one simulator per worker

Use a worker-scoped fixture to start Counterfact once, and an automatic test
fixture to await `simulator.reset()` before each test. An optional test option
can select a scenario after reset:

```ts
// Inside your automatic test fixture:
await workerSimulator.reset();
if (scenarioName) await workerSimulator.scenario(scenarioName);
await use(workerSimulator);
```

The complete [runnable Playwright example](https://github.com/counterfact/api-simulator/tree/main/examples/playwright-reset)
includes configuration, routes, startup, fixture teardown, a per-test scenario
option, and assertions that deleted baseline data returns before the next test.
It uses Playwright's HTTP request fixture, so no browser installation is required.

Each worker needs its own simulator and port. Tests on one worker share a
listener but reset before every test. Await outstanding requests before reset;
requests arriving while reset runs receive 503. A failed reset keeps HTTP
unavailable until a later reset succeeds. Discard saved contexts and stores,
and reacquire them with `simulator.loadContext()` and `simulator.store` after
reset. See [Programmatic API](../features/programmatic-api.md) for full lifecycle
and failure semantics.

## Other test runners

The same lifecycle works with suite hooks:

```ts
let simulator;
let stop;

beforeAll(async () => {
  simulator = await counterfact(config);
  ({ stop } = await simulator.start(config));
});

beforeEach(async () => {
  await simulator.reset();
});

afterAll(async () => {
  await stop();
});
```

Use the [complete configuration](../features/programmatic-api.md), apply named
scenarios with `await simulator.scenario(name)`, then send HTTP requests to the
configured port. Keep independently running tests on separate simulators.

## Keep exploring

- [Scenario Scripts](./scenario-scripts.md) — reusable state transformations
- [Share State Across API Groups](./shared-store.md) — one application store
- [Programmatic API](../features/programmatic-api.md) — lifecycle and reference rules
