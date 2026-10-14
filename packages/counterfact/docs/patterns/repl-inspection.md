# Live Server Inspection with the REPL

Explore a running mock from the REPL: seed data, send real HTTP requests, inspect state, and toggle behavior without editing files or restarting.

## Why teams use this

Development workflows that require a restart to change behavior — seeding a database, flipping a feature flag, or exercising an edge case — break the feedback loop. Writing a dedicated script just to set up a specific scenario adds friction. Logging and printf-debugging only gives you output, not interactive control.

## How it works

Use Counterfact's built-in REPL. For a single API group, `context` is its root context; with multiple groups, `context` and `loadContext` are keyed by group. The REPL runs alongside the server in the same terminal, connected directly to the live `context` and a built-in `client`. You can call context methods to inspect or mutate state, send HTTP requests, read the responses, and toggle behavior flags — all without touching a file or restarting anything.

## Example

Start the server with the REPL enabled (the default when running via `npx counterfact@latest`). The prompt `⬣>` indicates the REPL is ready.

### Seed test data

```
⬣> context.add({ name: "Fluffy", status: "available", photoUrls: [] })
{ id: 1, name: 'Fluffy', status: 'available', photoUrls: [] }

⬣> context.add({ name: "Rex", status: "pending", photoUrls: [] })
{ id: 2, name: 'Rex', status: 'pending', photoUrls: [] }
```

### Send real requests and inspect responses

`client` prints HTTP request/response text and returns a promise of the raw response string. The transcripts below show abbreviated response output: request logs, headers, and colors are omitted. `void` starts the request without also displaying the returned promise; use `await client.get(...)` when you need the raw string.

```
⬣> void client.get("/pet/1")
HTTP/1.1 200 OK

{"id":1,"name":"Fluffy","status":"available","photoUrls":[]}

⬣> void client.post("/pet", { name: "Bella", status: "available", photoUrls: [] })
HTTP/1.1 200 OK

{"id":3,"name":"Bella","status":"available","photoUrls":[]}
```

### Toggle failure modes without editing a file

If the context exposes a failure flag (see [Simulate Failures and Edge Cases](./simulate-failures.md)):

```
⬣> context.isRateLimited = true
⬣> void client.get("/pet/1")
HTTP/1.1 429 Too Many Requests

Too Many Requests

⬣> context.isRateLimited = false
⬣> void client.get("/pet/1")
HTTP/1.1 200 OK

{"id":1,"name":"Fluffy","status":"available","photoUrls":[]}
```

### Inspect state mid-session

```
⬣> context.list()
[
  { id: 1, name: 'Fluffy', status: 'available', photoUrls: [] },
  { id: 2, name: 'Rex', status: 'pending', photoUrls: [] },
  { id: 3, name: 'Bella', status: 'available', photoUrls: [] }
]

⬣> context.list().filter(p => p.status === "available").length
2
```

### Control the proxy at runtime

```
⬣> .proxy url https://api.example.com
⬣> .proxy on /payments
⬣> void client.get("/payments/42")
HTTP/1.1 200 OK

... real response body ...

⬣> .proxy off /payments
```

These commands enable and then disable the `/payments` proxy entry. More specific child entries can still override it; turning off the root alone does not clear a subtree override.

## What you get

- Changes made through the REPL take effect on the next request with no restart; the server is never interrupted.
- REPL state changes persist for the lifetime of the server process; restarting the server resets the context to its initial values.
- In a single group, `context` is its root instance; handlers in subtrees with their own context files use those nearer instances — there is no synchronization lag.
- The REPL is a JavaScript environment; it supports interactive expressions and top-level `await`, with Node.js REPL syntax rules.

## Keep exploring

- [Share State Across API Groups](./shared-store.md) — inspect the unqualified live `store` shared by every API group
- [Simulate Failures and Edge Cases](./simulate-failures.md) — expose context flags that the REPL can toggle
- [Federated Context Files](./federated-context.md) — use `loadContext()` in a single-group REPL to inspect a specific domain's context
- [Mock APIs with Dummy Data](./mock-with-dummy-data.md) — use the REPL to seed and inspect stateful handler data
- [Hybrid Proxy](./hybrid-proxy.md) — toggle individual proxy paths from the REPL during development
