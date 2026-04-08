---
title: "Support seeded/deterministic random responses for reproducible agent testing"
parentIssue: 1720
labels:
  - enhancement
  - agent-ux
assignees: []
milestone:
---

When Counterfact generates random example responses (via `@faker-js/faker` or similar), the values change on every request. For human developers iterating interactively this is fine, but for AI agents it causes two problems:

1. **Non-deterministic test failures** – an agent writing assertions against a response can't predict the value it will receive.
2. **Irreproducible debugging sessions** – when an agent records a failing scenario and tries to reproduce it, the server produces different data.

Allowing consumers to fix the random seed makes responses repeatable across runs without requiring every route handler to be rewritten.

## Proposed change

1. Add an optional `--seed <number>` CLI flag (and a corresponding `seed` field in `Config`, default `undefined`).
2. When a seed is provided, initialise `faker` (and any other PRNG used in response generation) with that seed before the server starts.
3. Expose the seed via the Admin API:

```
GET  /_counterfact/api/config/seed      → { seed: 42 | null }
POST /_counterfact/api/config/seed      → body { "seed": 42 } sets a new seed at runtime
DELETE /_counterfact/api/config/seed    → removes the seed, restoring random behaviour
```

Setting the seed at runtime resets the PRNG state, so the sequence of random values produced by subsequent requests is identical to what would be produced by starting the server with that seed.

## Motivation

- Agents running regression tests need stable, assertable values.
- CI pipelines benefit from deterministic snapshots they can diff against a known baseline.
- Human developers can share a seed when filing a bug report, letting others reproduce the exact same generated data.

## Acceptance criteria

- [ ] `counterfact --seed 42 …` produces the same sequence of random responses across multiple server restarts
- [ ] `POST /_counterfact/api/config/seed` with `{ "seed": 42 }` takes effect immediately; the next generated response uses the seeded sequence
- [ ] `DELETE /_counterfact/api/config/seed` restores non-deterministic (truly random) behaviour
- [ ] Without `--seed`, behaviour is unchanged (fully random as today)
- [ ] The `seed` value is included in `GET /_counterfact/api/config` response
- [ ] Unit tests assert that the same seed yields the same output, and that different seeds yield different outputs
