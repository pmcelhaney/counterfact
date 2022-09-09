# Counterfact

[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main)

> This project is a work in progress. As of September 9, 2022, most of the plumbing is in place but the APIs are still solidifying and it's not quite ready for day-to-day use. See the [Version 1.0](https://github.com/pmcelhaney/counterfact/milestone/3) and [Future](https://github.com/pmcelhaney/counterfact/milestone/5) milestones.

Counterfact is (will be) a tool that helps front end developers and back end developers collaborate by quickly building reference implementations of [OpenAPI](https://www.openapis.org/) documents.

Counterfact makes it easy to build a **fake RESTful back end** to use when **testing the UI**, both manual and automated testing. UI testing can be quite tedious and brittle in part because the _arrange_ part of Arrange, Act, Assert -- getting the server into a particular state -- is often slow, unpredictable, and complex. Counterfact bypasses the accidental complexity associated with arranging a real server's state, making tests that isolate the UI fast, repeatable, and easy to maintain.

It accomplishes that without over-isolating. You can run a full scenario: log in, make changes, log in with a different user, and see the effects of those changes. The server you're testing against is a _real_ server from the UI's perspective: it implements business logic and maintains state. It's only not real in the sense that it doesn't have to support 10,000 concurrent users, protect real data, go through a deployment pipeline, or maintain 99.99% uptime.

Counterfact is **great** for **communication between front end and back end teams** and **prototyping workflows**. OpenAPI does an excellent job defining the inputs and outputs of a RESTful service, but it can't tell us how a server is supposed to behave. Counterfact fills that gap. The feedback cycle is orders of magnitude faster than making changes to a real, scalable back end and then seeing how those changes affect the UI/UX.
