---
title: "Feature: Scenario Playbooks — Multi-Step API Journey Simulation"
parentIssue: 1716
labels:
  - enhancement
assignees: []
milestone:
---

An API is not a collection of independent endpoints. It is a *choreography* — a sequence of calls that together express a user's intent. Creating an account, adding items to a cart, checking out, receiving a confirmation: these are journeys, not isolated transactions. Mock servers that treat each request in isolation miss the most important dimension of API behavior.

Counterfact should support **scenario playbooks**: named, declarative scripts that define a sequence of API calls with assertions at each step. A playbook can be run manually (from the REPL or dashboard) as a live simulation, or executed automatically as an integration test. Playbooks can also be used as "seeds" — running a scenario to put the mock server into a known pre-condition state before a demo or test session.

The playbook format should be simple enough to write by hand, but also auto-generated from a recording of real interaction history (connecting naturally to the time-travel feature). This makes it trivially easy to capture a bug-reproducing sequence and turn it into a regression test.

Alan Kay noted that the power of a medium is not in individual features but in how they *compose*. Playbooks are the composition layer that turns discrete API capabilities into observable, testable user experiences.

## Acceptance criteria

- [ ] Playbooks are defined as TypeScript files (or JSON/YAML) describing ordered sequences of HTTP calls with optional assertions on response status, headers, and body
- [ ] Running `counterfact play <playbook>` executes the scenario against the running mock server and reports pass/fail for each step
- [ ] A `--seed` flag runs the playbook to populate context state without running assertions, preparing the server for a demo or test session
- [ ] Playbooks can be generated from the interaction history log via `counterfact record`
- [ ] The REPL exposes a `play("<playbook>")` function to run a playbook interactively
- [ ] Playbook execution is integrated with the browser dashboard, showing a visual step-by-step progress view
