# Failures, latency, and edge cases

Use controlled responses to see what the client does when an API is slow, returns no results, rejects a request, or fails temporarily.

## Return a specific case

Change the relevant handler to return a deterministic body. For a collection operation, an empty collection can exercise an empty screen:

```ts
export const GET: HTTP_GET = ($) => $.response[200].json([]);
```

Choose a body that matches your operation's schema. For an error, choose a status and body declared by your specification. If the test intentionally violates the contract, use `$.x.response` and check the validation settings explicitly.

## Add a delay

```ts
export const GET: HTTP_GET = async ($) => {
  await $.delay(1500);
  return $.response[200].random();
};
```

The delay is in milliseconds. Supply two numbers for a random duration within that range. Use a fixed delay when comparing client behavior across runs.

## Make a failure repeatable

Put a condition in a context when the test must switch between success and failure without editing the handler. Change that condition through a scenario, the REPL, or test code. Model the client-visible state rather than introducing special usernames or magic request values.

Hot reload applies handler edits while preserving live state. Resetting state in tests is an explicit [programmatic operation](../api/simulator.md).

See [failure patterns](../patterns/simulate-failures.md), [latency patterns](../patterns/simulate-latency.md), and [validation](./validation.md).
