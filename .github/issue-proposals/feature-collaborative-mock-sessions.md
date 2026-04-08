---
title: "Feature: Collaborative Mock Sessions — Shared Live Server State"
parentIssue: 1716
labels:
  - enhancement
assignees: []
milestone:
---

Software is not built alone. Yet our developer tools — including mock servers — assume a single user sitting at a single terminal. When a frontend team and a backend team are building against the same API contract, they should be able to share a *single live simulation*, see each other's changes to context state in real time, and coordinate around the same source of truth.

Counterfact should support a "shared session" mode where multiple developers connect to the same mock server instance. Each developer's REPL commands, route handler edits, and context mutations are broadcast to all connected clients. A lightweight event feed in the browser dashboard would show who changed what and when.

This is not screen sharing. It is a true multi-user, live computational object — closer to Alan Kay's vision of the Dynabook as a networked personal computer that lets people genuinely collaborate on shared computational artifacts. The mock server stops being a local tool and becomes a *shared workspace*.

A lightweight implementation could use Server-Sent Events or WebSockets to push state deltas to connected browser sessions, with no external infrastructure required beyond the existing Koa server.

## Acceptance criteria

- [ ] Multiple browser tabs (or users on a LAN) can open the Counterfact dashboard and see live updates when context state changes on the server
- [ ] REPL commands that mutate context state are broadcast to all connected dashboard sessions within 500ms
- [ ] The dashboard shows a live activity feed of recent state-changing events (endpoint hit, context mutated, route reloaded)
- [ ] Route handler file changes (hot reload) are reflected in all connected clients' dashboards
- [ ] Collaboration features work entirely within the existing Koa server — no additional services, proxies, or accounts required
- [ ] A "presence" indicator shows how many active browser sessions are connected
