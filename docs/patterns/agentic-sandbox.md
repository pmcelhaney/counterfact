# Agentic Sandbox

You are developing an AI agent that calls third-party APIs. Running the agent against the real service during development is expensive, rate-limited, and produces unpredictable results.

## Problem

Third-party API calls from an agent cost money, consume quota, and can fail for reasons unrelated to the agent's logic. Reproducibility is essential for iterating on agent behavior, but real services are not reproducible.

## Solution

Point the agent at a Counterfact mock instead of the real service. Control exactly what the mock returns so you can test every response scenario — including failures — cheaply and repeatably. Use the REPL to change mock behavior while the agent is running, without restarting anything.

## Example

Generate the mock from the target API's OpenAPI spec:

```sh
npx counterfact@latest https://api.openai.com/openapi.yaml openai-mock
```

Configure the agent's API base URL to point at the mock:

```ts
const client = new OpenAI({ baseURL: "http://localhost:3100" });
```

Customize the handler to return the responses your agent should practice with:

```ts
// openai-mock/routes/v1/chat/completions.ts
export const POST: HTTP_POST = ($) => {
  return $.response[200].json({
    id: "chatcmpl-test",
    choices: [{ message: { role: "assistant", content: "I can help you with that." }, finish_reason: "stop" }],
  });
};
```

To test how the agent handles a rate limit, edit the handler — or toggle a context flag and steer the agent from the REPL while it runs:

```ts
// openai-mock/routes/_.context.ts
export class Context {
  simulateRateLimit = false;
}
```

```ts
// openai-mock/routes/v1/chat/completions.ts
export const POST: HTTP_POST = ($) => {
  if ($.context.simulateRateLimit) {
    return $.response[429].json({ error: { message: "Rate limit exceeded" } });
  }
  return $.response[200].json({
    id: "chatcmpl-test",
    choices: [{ message: { role: "assistant", content: "I can help you with that." }, finish_reason: "stop" }],
  });
};
```

```
⬣> context.simulateRateLimit = true
```

The agent's next request hits the 429. Its retry logic runs for real.

## Consequences

- Every request is local, instantaneous, and free — iteration speed is limited only by the agent's logic.
- Response content is fully controlled, so agent behavior is reproducible across runs.
- The mock does not replicate the real API's stateful semantics unless you implement them explicitly.
- The mock is only as accurate as the OpenAPI spec it was generated from.

## Related Patterns

- [Simulate Failures and Edge Cases](./simulate-failures.md) — the general technique for toggling error conditions at runtime
- [Mock APIs with Dummy Data](./mock-with-dummy-data.md) — serve realistic responses for the happy path
- [Hybrid Proxy](./hybrid-proxy.md) — selectively forward some agent calls to the real API while mocking others
