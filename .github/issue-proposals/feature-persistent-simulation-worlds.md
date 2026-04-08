---
title: "Feature: Persistent Simulation Worlds — Named, Saveable Server States"
parentIssue: 1716
labels:
  - enhancement
assignees: []
milestone:
---

Every mock server session starts from scratch. Every time a developer restarts Counterfact, they re-seed their data by hand, run setup scripts, or accept whatever random data the server generates. This is a tax on every development session, every demo, and every exploratory test. More importantly, it means teams cannot share a consistent, named starting point for their work.

Counterfact should support **simulation worlds**: named snapshots of the complete server state — including all context object contents and active fault configurations — that can be saved, loaded, shared, and versioned alongside code. A team could maintain a `worlds/` directory with files like `empty.world.json`, `populated-catalog.world.json`, and `checkout-error.world.json`, each capturing a specific pre-condition for development or testing.

Worlds are different from playbooks. A playbook is a *sequence of actions* to reach a state. A world is the *state itself*, serialized and ready to restore instantly. Both are valuable; worlds are faster when the state is complex and the sequence to reach it is long or hard to automate.

Alan Kay's vision of computing was always about objects that persist and can be sent to other people — the original Smalltalk image was a complete, portable environment you could share. Simulation worlds bring that same idea to API development: the environment becomes an artifact, not an ephemeral accident.

## Acceptance criteria

- [ ] Context state can be serialized to a JSON file via the REPL (`.world save <name>`) or CLI (`counterfact world save <name>`)
- [ ] A saved world file captures the full serialized state of all context objects registered in the server
- [ ] A world can be loaded on startup (`counterfact --world populated-catalog`) or at runtime via the REPL (`.world load <name>`) without restarting the server
- [ ] World files are human-readable JSON and can be committed to source control
- [ ] Loading a world replaces all current context state and emits a clear log message confirming the loaded world's name and timestamp
- [ ] The dashboard shows the name of the currently loaded world (if any) and offers a dropdown to switch between available worlds
- [ ] Worlds directory defaults to `<destination>/worlds/` and is configurable via `--worlds-dir`
