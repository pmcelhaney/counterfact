<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

**Your backend isn't ready. Your frontend can't wait. Counterfact closes the gap.**

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

Counterfact turns an OpenAPI spec into a **stateful, TypeScript-native mock server** — in one command.

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

> Requires Node ≥ 22.0.0

In under 10 seconds you have a running server where every endpoint returns valid data. Then you make it yours.

---

## Five things it does that other tools don't

**1. Returns schema-valid data instantly — no code needed.**  
Every generated route calls `.random()` out of the box. You get a working API the moment the command finishes.

**2. Lets you write real TypeScript in your route handlers.**  
Replace `.random()` with `.json(...)` and your own logic. TypeScript knows exactly what shapes are valid because the types come straight from your spec. Autocomplete and JSDoc work immediately.

**3. Preserves state across requests — and across hot reloads.**  
One shared `_.context.ts` class connects all your routes. POST a pet, GET it back. Restart? State resets cleanly. Everything is in-memory; there is no database to manage.

**4. Gives you a live REPL connected to the running server.**  
Seed data, fire requests, and flip feature flags without touching a file or restarting. The REPL has direct access to context and a typed HTTP client.

**5. Proxies specific paths to the real API, mocks the rest.**  
Start fully mocked. As the real backend catches up, proxy individual paths forward one at a time — or toggle them from the REPL at runtime.

---

## Who it's for

| | |
|---|---|
| **Frontend teams** | Build against a working API before the backend exists |
| **QA engineers** | Reproduce edge cases, failures, and stateful flows on demand |
| **API designers** | Validate your spec contract while you write it |
| **AI agent builders** | Run a full-fidelity local mock — no rate limits, no costs |
| **Integration testers** | Spin up a real HTTP server in CI with a clean, predictable state |

---

## Go deeper

| | |
|---|---|
| [Getting started](./docs/getting-started.md) | Step-by-step walkthrough: zero to stateful mock |
| [Usage patterns](./docs/usage-patterns.md) | Fourteen patterns for real-world API simulation |
| [Reference](./docs/reference.md) | `$` parameter, response builder, CLI flags, architecture |
| [How it compares](./docs/comparison.md) | Side-by-side with json-server, WireMock, Prism, and more |
| [Petstore example](https://github.com/counterfact/example-petstore) | A complete, fully implemented example |

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>
