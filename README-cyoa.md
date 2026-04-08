<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

---

**Counterfact turns an OpenAPI spec into a live, stateful, TypeScript-native mock server — in one command.**

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

> Requires Node ≥ 22.0.0

---

## Choose your README

Everyone reads documentation differently. Pick the version that matches how you think:

---

### [📖 Technical Deep Dive](./README-v1-technical.md)
*Architecture diagram, full API reference, every feature explained in depth.*

For developers who want to understand the system completely before using it. Covers the generator pipeline, generated file structure, the `$` parameter API, state management internals, hot reload, REPL, middleware, proxy, and a full CLI reference table with accurate defaults.

**Best for:** engineers who want to evaluate the full picture before committing, or who need a reference they can return to.

---

### [🚀 Marketing / Elevator Pitch](./README-v2-marketing.md)
*Short, punchy, conversion-focused.*

Opens with the problem (blocked teams), shows the solution in one command, then delivers scannable feature highlights. Includes a before/after comparison table and a "perfect for" section covering frontend teams, AI agents, QA engineers, and developers exploring new APIs.

**Best for:** developers who just landed on the project page and want to know in 90 seconds whether it's worth their time.

---

### [📚 Story-Driven Tutorial](./README-v3-narrative.md)
*Starts with a relatable scenario and walks through the tool as a guided narrative.*

Opens with "the backend isn't ready yet" — a situation every frontend developer knows — and follows a team using Counterfact step by step. Introduces each feature in context, with motivation before code.

**Best for:** developers who learn better through narrative and examples than through reference docs.

---

### [❓ FAQ](./README-v4-faq.md)
*Answers the questions you'd ask before adopting a new tool.*

Structured as a question-and-answer reference. Covers: what it is, who it's for, what it generates, how state works, whether requests are validated, how it handles spec changes, whether it can behave like a real backend, middleware, programmatic usage, and more.

**Best for:** developers with specific questions who want direct answers without reading prose.

---

### [⚖️ Comparison to Alternatives](./README-v5-comparison.md)
*Honest side-by-side with json-server, WireMock, Prism, Microcks, and MSW.*

Includes a feature comparison matrix and a short "when to use which" section for each competitor. Finishes with what makes Counterfact unique: type-safe handler generation, state-preserving hot reload, and the live REPL.

**Best for:** developers evaluating their options who want to know how Counterfact fits alongside tools they already know.

---

### [💻 Show Don't Tell](./README-v6-code-first.md)
*Minimal prose. Maximum code.*

Starts the server in the first five lines. Every section after that is a code block demonstrating one thing. No long explanations — just working examples you can copy directly.

**Best for:** developers who learn by reading code, not prose.

---

## Not sure which to pick?

If you've never heard of Counterfact: → [Marketing / Elevator Pitch](./README-v2-marketing.md)

If you want to get hands-on immediately: → [Show Don't Tell](./README-v6-code-first.md)

If you're evaluating it against other tools: → [Comparison to Alternatives](./README-v5-comparison.md)

If you have a specific question: → [FAQ](./README-v4-faq.md)

If you want the full picture: → [Technical Deep Dive](./README-v1-technical.md)

---

## Quick reference

| | |
|---|---|
| **License** | MIT |
| **Language** | TypeScript |
| **OpenAPI** | 3.x |
| **Node** | ≥ 22 |
| **Port (default)** | 3100 |
| **Swagger UI** | `http://localhost:3100/counterfact/` |
| **Docs** | [docs/usage.md](./docs/usage.md) |
| **Changelog** | [CHANGELOG.md](./CHANGELOG.md) |

---

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>
