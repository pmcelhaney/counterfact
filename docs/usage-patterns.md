# Usage Patterns

A pattern is a reusable solution to a recurring problem when building API simulations with Counterfact. Each pattern below describes a context, the problem it addresses, the solution, and its consequences.

Most projects start with [Explore a New API](./patterns/explore-new-api.md) or [Executable Spec](./patterns/executable-spec.md) to get a running server from an OpenAPI spec with no code. From there, [Mock APIs with Dummy Data](./patterns/mock-with-dummy-data.md) and [AI-Assisted Implementation](./patterns/ai-assisted-implementation.md) are the natural next steps for adding realistic responses — the former by hand, the latter with an AI agent doing the heavy lifting. As the mock grows, [Federated Context Files](./patterns/federated-context.md) and [Test the Context, Not the Handlers](./patterns/test-context-not-handlers.md) keep the stateful logic organized and reliable. Throughout all of this, [Live Server Inspection with the REPL](./patterns/repl-inspection.md) is Counterfact's most distinctive feature: it lets you seed data, send requests, and toggle behavior in real time without restarting. [Simulate Failures and Edge Cases](./patterns/simulate-failures.md) and [Simulate Realistic Latency](./patterns/simulate-latency.md) extend any mock to cover error paths and performance characteristics that real services exhibit. [Reference Implementation](./patterns/reference-implementation.md) and [Executable Spec](./patterns/executable-spec.md) make the mock a first-class artifact that teams can rely on as the API evolves. Finally, [Agentic Sandbox](./patterns/agentic-sandbox.md) and [Hybrid Proxy](./patterns/hybrid-proxy.md) address the two common integration strategies — isolating an AI agent from the real service, or blending mock and live traffic across endpoints.

| Pattern | When to use it |
|---|---|
| [Explore a New API](./patterns/explore-new-api.md) | You have a spec but no running backend or production access |
| [Executable Spec](./patterns/executable-spec.md) | You want immediate feedback on how spec changes affect the running server during API design |
| [Mock APIs with Dummy Data](./patterns/mock-with-dummy-data.md) | You need realistic-looking responses to build a UI, run a demo, or write assertions |
| [AI-Assisted Implementation](./patterns/ai-assisted-implementation.md) | You want an AI agent to replace random responses with working handler logic |
| [Federated Context Files](./patterns/federated-context.md) | You want each domain to own its state, with explicit cross-domain dependencies |
| [Test the Context, Not the Handlers](./patterns/test-context-not-handlers.md) | You want to keep shared stateful logic reliable as the mock grows |
| [Live Server Inspection with the REPL](./patterns/repl-inspection.md) | You want to seed data, send requests, and toggle behavior without restarting the server |
| [Simulate Failures and Edge Cases](./patterns/simulate-failures.md) | You need reproducible, on-demand error conditions for development or testing |
| [Simulate Realistic Latency](./patterns/simulate-latency.md) | You want to test how clients and UIs behave under realistic response times |
| [Reference Implementation](./patterns/reference-implementation.md) | You want a working, executable implementation that expresses intended API behavior in code |
| [Agentic Sandbox](./patterns/agentic-sandbox.md) | You are building an AI coding agent and want to avoid rate limits and costs during development |
| [Hybrid Proxy](./patterns/hybrid-proxy.md) | Some endpoints exist in the real backend; others need to be mocked |

## See also

- [Getting started](./getting-started.md)
- [Reference](./reference.md)
- [FAQ](./faq.md)
- [How it compares](./comparison.md)
