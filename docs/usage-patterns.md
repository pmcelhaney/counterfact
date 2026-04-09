# Usage Patterns

A pattern is a reusable solution to a recurring problem when building API simulations with Counterfact. Each pattern below describes a context, the problem it addresses, the solution, and its consequences.

| Pattern | When to use it |
|---|---|
| [Explore a New API](./patterns/explore-new-api.md) | You have a spec but no running backend or production access |
| [Simulate Failures and Edge Cases](./patterns/simulate-failures.md) | You need reproducible, on-demand error conditions for development or testing |
| [Mock APIs with Dummy Data](./patterns/mock-with-dummy-data.md) | You need realistic-looking responses to build a UI, run a demo, or write assertions |
| [AI-Assisted Implementation](./patterns/ai-assisted-implementation.md) | You want an AI agent to replace random responses with working handler logic |
| [Agentic Sandbox](./patterns/agentic-sandbox.md) | You are building an AI coding agent and want to avoid rate limits and costs during development |
| [Hybrid Proxy](./patterns/hybrid-proxy.md) | Some endpoints exist in the real backend; others need to be mocked |
| [Reference Implementation](./patterns/reference-implementation.md) | You want a working, executable implementation that expresses intended API behavior in code |
| [Executable Spec](./patterns/executable-spec.md) | You want immediate feedback on how spec changes affect the running server during API design |

## See also

- [Getting started](./getting-started.md)
- [Reference](./reference.md)
- [FAQ](./faq.md)
- [How it compares](./comparison.md)
