<div align="center" markdown="1">

<img src="../../counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](../../typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

Counterfact reads your OpenAPI spec, generates TypeScript handlers for every endpoint, and starts a stateful local server in one command. Unlike static mock servers, handlers share state across routes, hot-reload when you edit them, and can be controlled at runtime through a built-in REPL.

The REPL is the key differentiator. With the server running, you can seed data, simulate failures, inspect context, and toggle a proxy to a live backend—no restart, no HTTP scripts, just direct control over a running system. It's designed for frontend developers who can't wait on a backend, test engineers who need reproducible API states, and AI coding agents that need a programmable, schema-valid API to iterate against.

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
