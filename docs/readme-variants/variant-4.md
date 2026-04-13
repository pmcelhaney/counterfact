<div align="center" markdown="1">

<img src="../../counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](../../typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

Most mock servers are passive. You configure them, they respond, and you can't touch them while they're running. Counterfact includes a REPL—a live control surface for the running server. Inspect state. Inject data. Trigger failure modes. Toggle a proxy to a real backend. All without restarting, while your clients are connected.

Everything else follows from that: Counterfact reads your OpenAPI spec and generates typed TypeScript handlers for every endpoint. Handlers share state across routes. The server hot-reloads when you edit a file. Schema validation catches contract violations before you make the request. It works for frontend developers, test engineers, and AI coding agents that need a stable, programmable API sandbox.

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
