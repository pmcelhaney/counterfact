---
title: "Feature: API Dependency Graph Visualization"
parentIssue: 1716
labels:
  - enhancement
assignees: []
milestone:
---

An API is a network of relationships, but every tool we use to build and document APIs presents it as a flat list of endpoints. This is exactly wrong. The endpoints of a REST API are not independent: they share types, they share state through context objects, and they form implicit workflows where the output of one call becomes the input of another. Understanding these relationships is essential for building a frontend correctly — and for understanding what will break when a spec changes.

Counterfact should generate and display an **API dependency graph**: a visual map showing which endpoints share context objects, which response types are reused across endpoints, and which endpoints form natural sequences (e.g., `POST /orders` produces an ID that `GET /orders/{id}` consumes). This graph would be rendered in the browser dashboard and also exportable as a static SVG/PNG for documentation.

The graph is not just decorative. It is a navigation tool: clicking a node should take you to the corresponding route handler file or type definition. It is also a change-impact tool: when you are about to modify an endpoint, the graph shows you exactly which other endpoints share its types or context.

Alan Kay believed that the most important thing a medium can do is make the *structure* of a system visible. A well-drawn dependency graph makes the invisible architecture of an API immediate and tangible. It turns an abstract contract into a comprehensible map.

## Acceptance criteria

- [ ] The Counterfact dashboard includes a "Graph" tab rendering an interactive dependency graph of all endpoints in the loaded OpenAPI spec
- [ ] Nodes represent endpoints; edges represent shared context objects, shared type definitions, or sequential dependencies (inferred from common ID parameters)
- [ ] Nodes are color-coded by HTTP method (GET, POST, PUT, DELETE, PATCH)
- [ ] Clicking a node opens the corresponding route handler file (via the dashboard's file editor or a link) and highlights the node's type dependencies
- [ ] The graph updates automatically when the spec or route files change
- [ ] The graph is exportable as SVG from the dashboard
- [ ] The layout is stable across rerenders (same positions for same endpoints), with an option to reset/re-layout
