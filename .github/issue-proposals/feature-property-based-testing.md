---
title: "Feature: Schema-Driven Property-Based Testing"
parentIssue: 1716
labels:
  - enhancement
  - testing
assignees: []
milestone:
---

Random data generation is already in Counterfact — but randomness that is only used for responses is only half the story. The *inputs* to an API are just as important to test systematically as the outputs. Property-based testing (generating many inputs that satisfy a spec's constraints and verifying that invariants hold) is one of the most powerful automated testing techniques available, and the OpenAPI spec gives us everything we need to do it.

Counterfact should be able to generate exhaustive input variations for each endpoint — edge cases for strings (empty, max length, unicode, special characters), boundary values for numbers, missing optional fields, extra unknown fields — and report which combinations cause route handlers to return unexpected responses, throw unhandled errors, or violate the spec's declared response schema.

This is not fuzzing. It is *systematic* exploration grounded in the spec's declared contracts. The goal is not to find security vulnerabilities but to find the cases a developer did not think to handle — the ones that will show up as bug reports two weeks after launch.

Alan Kay has long argued that understanding a system means knowing what it does across its entire possible space of inputs, not just the happy path a developer was thinking about when they wrote it. Property-based testing is the automated expression of that principle.

## Acceptance criteria

- [ ] A `counterfact test` command runs property-based tests against the running mock server, deriving test inputs from the OpenAPI spec
- [ ] Test inputs cover: boundary values for numeric types (min, max, 0, -1), empty and max-length strings, null vs. undefined optional fields, and valid vs. invalid enum values
- [ ] For each generated input, the test verifies that the response matches the declared response schema for the returned status code
- [ ] Failures are reported with the exact input that triggered the unexpected behavior and a clear description of the violation
- [ ] The number of generated cases per endpoint is configurable (default: 50)
- [ ] Tests can be scoped to a specific endpoint or run across all endpoints
- [ ] A `--seed` option enables reproducible test runs
