<div align="center" markdown="1">

<img src="../../counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](../../typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

AI coding agents need APIs that behave predictably across many requests. Static mock servers return fixed data, which isn't enough when an agent is iterating on real workflows that depend on state, error paths, or sequential side effects. Counterfact gives agents—and the developers working alongside them—a fully programmable API sandbox: stateful, type-safe, hot-reloading, and controllable at runtime.

Give it an OpenAPI spec and it generates TypeScript handlers for every endpoint and starts a server. The built-in REPL is the key differentiator: inspect state, seed test data, simulate failures, and toggle a proxy to a real backend—all on a live server, without restarting. It works just as well for a frontend developer who can't wait on a backend or a test engineer who needs clean, reproducible API behavior.

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
