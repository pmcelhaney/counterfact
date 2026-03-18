<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>



# Counterfact

Counterfact is an API simulator that lets developers build against a contract instead of a running backend.

Most teams are slower than they should be—not because of code, but because they’re tightly coupled to systems they don’t own. Waiting on APIs, coordinating changes, keeping environments in sync—it all adds friction.

Counterfact removes that dependency.

It reads an OpenAPI spec and generates a live, type-safe API where each endpoint maps to a TypeScript file. Responses conform to the contract but are randomized by default, so tests depend on behavior rather than hardcoded values. Developers (and now AI agents) can override anything to model real scenarios, with instant feedback and no restart. State is live and directly editable through a REPL, so you can shape and explore scenarios in real time.

The result is tighter feedback loops and true parallel development.

> Built by Patrick McElhaney · Open to work → https://patrickmcelhaney.org

## What is Counterfact?

Counterfact is an API simulator that runs directly from an OpenAPI contract.

Instead of waiting for a backend—or mocking responses by hand—it generates a live API that behaves like the real thing:

- Every endpoint is backed by executable code (TypeScript files)  
- Responses conform to the schema, but are randomized by default  
- Behavior can be overridden at any time to model real scenarios  
- State is live and editable through a built-in REPL  

It’s not a mock server, and it’s not just static fixtures.

It’s a working system you can shape in real time.

## How is this different?

Most approaches fall into two categories:

**Mock servers**
- Static or semi-dynamic responses  
- Drift from the contract over time  
- Limited ability to model real behavior  

**Fixtures / stubs**
- Hand-written and brittle  
- Require constant maintenance  
- Hard to scale across teams  

**Counterfact**
- Generated from the contract  
- Always schema-valid  
- Dynamic by default  
- Fully programmable and interactive  

## Quick Start

Get a live API from an OpenAPI spec in seconds. Requires Node.js >= 17.0.0.

```bash
npx counterfact openapi.yaml --destination api/
```

Your API is now running locally.

- Endpoints match your contract  
- Responses are valid but randomized by default  
- You can override behavior instantly via the REPL  

That’s it—you can start building against it immediately, without waiting on a backend.

---

## How it works

Counterfact reads your OpenAPI specification and generates a live API server.

Each endpoint is mapped to a TypeScript file, giving you full control over behavior while preserving contract validity.

- Default responses are generated from the schema  
- Randomization ensures tests rely on structure, not hardcoded values  
- Overrides let you simulate real-world scenarios  
- State is persistent and editable at runtime  

Because everything is driven from the contract, your frontend and backend can evolve independently without breaking each other.

## When to use Counterfact

- Frontend development without a backend  
- Parallel development across teams  
- Testing against realistic but controlled data  
- Prototyping new APIs quickly  
- Working with incomplete or evolving contracts  

## About the author

Counterfact came out of a pattern I kept seeing: teams are slowed down more by coordination than by code.

I build tools and systems to remove that friction—improving developer experience, enabling parallel work, and making complex systems easier to reason about.

I’m currently exploring new opportunities in platform engineering and developer experience.

→ https://patrickmcelhaney.org

