---
title: "Feature: Visual Object Browser for Live Server State"
parentIssue: 1716
labels:
  - enhancement
assignees: []
milestone:
---

The terminal REPL is powerful but opaque. Text output gives you answers to questions you already know how to ask. A visual object browser lets you *discover* what is in the system — clicking into nested structures, watching values change in real time, and editing fields directly without writing code. This is the difference between a system you interrogate and a system you understand.

Counterfact already has a browser dashboard. That dashboard should include a live, interactive view of the context object tree — displayed not as serialized JSON text, but as a navigable tree of live objects. Clicking a property would let you edit it in place. Arrays would be shown with their current length and expandable entries. Clicking a method would let you call it with arguments and see the result immediately.

This is the Smalltalk object inspector, brought to the API mock server. Alan Kay's original Smalltalk environment made every object inspectable and editable at runtime because that is the only way to truly *understand* an object-oriented system. The same principle applies to a context-driven API simulator.

This feature would make Counterfact genuinely approachable for developers who are not comfortable with a REPL — including QA engineers, product managers, and designers who need to manipulate API state for demos or exploratory testing.

## Acceptance criteria

- [ ] The Counterfact browser dashboard includes a "State" tab showing the context object tree for all registered routes
- [ ] The tree is rendered hierarchically: route path → context class instance → properties and their current values
- [ ] Primitive properties (string, number, boolean) are editable inline; changes are immediately reflected in the live server
- [ ] Array and object properties are expandable and show their current contents
- [ ] The view refreshes automatically when context state changes (via hot reload or REPL mutation)
- [ ] A search/filter field allows developers to find specific properties by name across the entire context tree
- [ ] The visual browser is read-only when the server is in a locked/production-like mode
