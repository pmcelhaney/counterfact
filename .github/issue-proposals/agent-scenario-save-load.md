---
title: "Add named scenario save/load to Admin API for rapid agent state switching"
parentIssue: 1720
labels:
  - enhancement
  - agent-ux
assignees: []
milestone:
---

AI agents often need to test the same application code against multiple server states (e.g. "empty inventory", "one item in cart", "checkout in progress"). Currently the only way to set up a known state is to call a series of `POST /_counterfact/api/contexts/:path` requests. There is no way to save that state, give it a name, and restore it later in one operation.

A scenario system lets agents define and switch between named server states with a single HTTP call.

## Proposed change

### Endpoints

```
POST   /_counterfact/api/scenarios          → create a scenario from current context state
GET    /_counterfact/api/scenarios          → list all saved scenarios
GET    /_counterfact/api/scenarios/:name    → get a specific scenario
PUT    /_counterfact/api/scenarios/:name    → create or overwrite a named scenario
POST   /_counterfact/api/scenarios/:name/load → restore server state from this scenario
DELETE /_counterfact/api/scenarios/:name    → delete a scenario
```

### Schema

```ts
interface Scenario {
  name: string;
  description?: string;
  createdAt: string;   // ISO-8601
  contexts: Record<string, unknown>;  // path → context object snapshot
}
```

### Behaviour

- Scenarios are stored **in memory** by default (cleared on restart). When `--persist-scenarios` is passed, scenarios are read from `.counterfact-scenarios.json` in `basePath` at startup (if the file exists), and every create/update/delete operation is immediately written back to that file. This means a server restarted with `--persist-scenarios` automatically restores all previously saved scenarios.
- `POST /_counterfact/api/scenarios/:name/load` calls the existing context reset logic, then replays every entry in the scenario's `contexts` map.

### Example workflow

```http
# 1. Set up a "one pet in store" state
POST /_counterfact/api/contexts/pets  { "pets": [{ "id": 1, "name": "Fido" }] }

# 2. Save it
PUT /_counterfact/api/scenarios/one-pet  { "description": "Single pet in store" }

# 3. Later, restore it instantly
POST /_counterfact/api/scenarios/one-pet/load
```

## Motivation

- Agents switching between test scenarios today must issue a reset followed by N context-update calls. A single `POST /load` cuts that to one round-trip.
- Named scenarios are self-describing, making it easy for a human reviewing the agent's work to understand what each test case represents.
- Scenarios can be committed alongside application code (via `--persist-scenarios`) to give teams a reproducible set of server states.

## Acceptance criteria

- [ ] `PUT /_counterfact/api/scenarios/empty-cart` saves the current context state under the name `empty-cart`
- [ ] `POST /_counterfact/api/scenarios/empty-cart/load` restores all contexts to the saved state
- [ ] `GET /_counterfact/api/scenarios` lists all saved scenarios with their names and descriptions
- [ ] `DELETE /_counterfact/api/scenarios/empty-cart` removes the scenario
- [ ] All endpoints respect the bearer-token / loopback auth guard
- [ ] Scenarios survive a context reset (reset only affects live contexts, not the saved scenario definitions)
- [ ] Unit tests cover CRUD operations and the load/restore round-trip
