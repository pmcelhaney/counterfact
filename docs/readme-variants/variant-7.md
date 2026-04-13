<div align="center" markdown="1">

<img src="../../counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](../../typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

You've used mock servers. You know where they stop being useful: static responses, no shared state, no way to inject a failure mid-run, no control without restarting. Counterfact picks up where they leave off.

Point it at an OpenAPI spec and it generates TypeScript handlers for every endpoint—type-safe, hot-reloading, sharing state across routes. A built-in REPL gives you a live control surface: seed data, trigger error conditions, proxy individual routes to a real backend, all on a running server. Whether you're a frontend developer waiting on a backend, a test engineer who needs clean reproducible state, or an AI agent that needs a stable API to work against, Counterfact is the simulator that doesn't plateau.

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
