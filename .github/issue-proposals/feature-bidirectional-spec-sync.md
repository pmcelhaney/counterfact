---
title: "Feature: Bidirectional Spec Sync — Living API Contracts"
parentIssue: 1716
labels:
  - enhancement
  - generator
assignees: []
milestone:
---

The most dangerous assumption in software is that a document and its implementation stay in sync automatically. They never do. The OpenAPI spec and the route handlers in Counterfact will diverge the moment a developer starts editing — and right now, the spec only flows one direction: *spec → types → handlers*.

A truly powerful system should close the loop. When a route handler returns a response shape that differs from what the spec declares, Counterfact should detect the divergence and offer to *update the spec* to match the new intent. The spec becomes a living contract that reflects the current understanding of the API, not a static document frozen at project inception.

This is not about auto-generating specs blindly — it is about making the feedback loop tight enough that developers are constantly aware of the gap between intention and specification. The spec should be as much a part of the development workflow as the code itself.

Alan Kay often said that a system that only goes one way is only half a system. The synthesis between description and behavior is where understanding actually lives.

## Acceptance criteria

- [ ] When a route handler's response is type-incompatible with its declared OpenAPI schema (detected at test or build time), Counterfact reports the divergence with a clear diff
- [ ] A CLI command (`counterfact sync`) analyzes the existing route handlers and reports any divergences between handler return types and the current OpenAPI spec
- [ ] The sync command offers an interactive mode (`--interactive`) that lets the developer choose, endpoint-by-endpoint, whether to update the spec or the handler
- [ ] Spec updates are written back as valid OpenAPI YAML/JSON preserving existing structure, comments, and ordering as much as possible
- [ ] The feature works with both local spec files and cached remote specs
- [ ] A dry-run mode (`--dry-run`) shows proposed spec changes without writing them
