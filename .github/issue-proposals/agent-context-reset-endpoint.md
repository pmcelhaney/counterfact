---
title: "Add context reset endpoint to Admin API for agent-friendly state recovery"
parentIssue: 1720
labels:
  - enhancement
  - agent-ux
assignees: []
milestone:
---

AI agents frequently make state-mutating requests while exploring an API (creating resources, updating fields, etc.). When an agent realises it has reached an inconsistent state, it currently has no way to recover short of restarting the Counterfact process. That restart destroys any session, breaks the agent's tooling loop, and wastes time.

A single HTTP call to reset every context back to its initial state would let agents recover instantly and retry from a known baseline, without restarting.

## Proposed change

Add a new admin API endpoint:

```
POST /_counterfact/api/contexts/reset
```

The endpoint should:

1. Remove every path-level context entry that was created or modified since startup (i.e. anything beyond the root `/` context that the `ContextRegistry` adds in its constructor).
2. Reset the root `/` context to an empty object `{}`.
3. Return `{ success: true, message: "All contexts reset" }`.

Optionally accept a JSON body `{ "path": "/pets" }` to reset only a single subtree rather than everything.

## Motivation

- Agents need fast, zero-friction feedback loops. A `POST /_counterfact/api/contexts/reset` call is trivially scriptable.
- The existing `POST /_counterfact/api/contexts/:path` endpoint can **update** a context, but it cannot erase keys or remove path-level entries; a dedicated reset endpoint is required.
- Human developers working in automated test loops also benefit: each test can start with a clean slate without restarting the server.

## Acceptance criteria

- [ ] `POST /_counterfact/api/contexts/reset` returns `200 { success: true }` and all contexts are restored to their initial state
- [ ] After a reset, `GET /_counterfact/api/contexts` returns only the root `/` context with an empty object
- [ ] `POST /_counterfact/api/contexts/reset` with body `{ "path": "/pets" }` resets only the `/pets` subtree and leaves other paths unchanged
- [ ] The endpoint is protected by the same bearer-token / loopback guard as all other admin API endpoints
- [ ] Unit tests cover the happy path, the scoped reset, and the auth-guard behaviour
