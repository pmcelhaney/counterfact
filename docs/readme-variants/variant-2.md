<div align="center" markdown="1">

<img src="../../counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](../../typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

Mock servers have a familiar ceiling: static responses, no memory between requests, no way to control them while they're running. They're useful for simple demos but break down when you need real behavior—state that accumulates, errors that happen on demand, responses that depend on what came before.

Counterfact is a programmable API simulator. Give it an OpenAPI spec and it generates typed TypeScript handlers for every endpoint, starts a stateful server, and opens a REPL. From the REPL you can inspect context, seed data, and inject failure modes live—no restart, no HTTP scripts, no ceremony. When the real backend is ready, toggle a proxy endpoint by endpoint and let the rest stay simulated. It's the right tool for frontend development, integration testing, and AI coding agents that need a stable API to work against.

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

> Requires Node ≥ 22.0.0

## Go deeper

| | |
|---|---|
| [Getting started](../getting-started.md) | Detailed walkthrough with state, REPL, and proxy |
| [Usage](../usage.md) | Feature index: routes, context, REPL, proxy, middleware, and more |
| [Patterns](../patterns/index.md) | Failures, latency, AI sandboxes, integration tests |
| [Reference](../reference.md) | `$` API, CLI flags, architecture |
| [How it compares](../comparison.md) | json-server, WireMock, Prism, Microcks, MSW |
| [FAQ](../faq.md) | State, types, regeneration |
| [Petstore example](https://github.com/counterfact/example-petstore) | Full working example |

<div align="center" markdown="1">

[Changelog](../../CHANGELOG.md) · [Contributing](../../CONTRIBUTING.md)

</div>
