<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

**Your backend isn't ready. Your frontend can't wait. Counterfact closes the gap.**

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>



Counterfact turns an [OpenAPI](https://www.openapis.org) spec into a stateful, TypeScript-native mock server in one command. Every endpoint is a `.ts` file you own and can edit live — with type safety, hot reload, and an interactive REPL — so your team can build against a real-feeling API before the backend exists.

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

> **Requires Node ≥ 22.0.0**  
> A complete, worked Petstore implementation is available at [counterfact/example-petstore](https://github.com/counterfact/example-petstore).


## Why Counterfact?

| The old way | With Counterfact |
|---|---|
| Wait for the backend to be ready | Start building against a live mock today |
| Hardcode fake data that breaks silently | Get type-safe responses generated from your spec |
| Restart the server every time you change something | Hot-reload keeps state while you iterate |
| Write a script to seed test data | Use the REPL to manipulate state interactively |
| Mock a few endpoints, ignore the rest | Every endpoint works out of the box |
| Return dumb static payloads | Write real logic — validate input, persist data, enforce business rules |


## What you can do with it

### A usable server in 10 seconds

Every generated route returns random, schema-valid data out of the box. No editing needed to get started.

```ts
// api/routes/pet/{petId}.ts  — generated, yours to edit
export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};
```

### Type safety and documentation baked in

Your spec defines the contract. TypeScript enforces it. Autocomplete tells you exactly what response shapes are valid, and JSDoc comments — pulled straight from your OpenAPI descriptions — appear inline as you type.

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].json({ id: $.path.petId, name: "Fluffy" });
  //                             ^ hover over `id` or `name` to see the JSDoc from your spec
};
```

### Shared state across routes

Create a `_.context.ts` file to share in-memory state across routes. Because state lives in the same process as the server it's lightning-fast, scalability doesn't matter (you're the only one using it), and restarting the server resets everything to a known clean state — no leftover data between test runs.

```ts
// api/routes/_.context.ts
export class Context {
  private pets = new Map<number, Pet>();
  private nextId = 1;

  add(data: Omit<Pet, "id">): Pet {
    const pet = { ...data, id: this.nextId++ };
    this.pets.set(pet.id, pet);
    return pet;
  }

  get(id: number): Pet | undefined { return this.pets.get(id); }
  list(): Pet[] { return [...this.pets.values()]; }
  remove(id: number): void { this.pets.delete(id); }
}
```

```ts
// api/routes/pet.ts
export const GET: HTTP_GET = ($) => $.response[200].json($.context.list());
export const POST: HTTP_POST = ($) => $.response[200].json($.context.add($.body));

// api/routes/pet/{petId}.ts
export const GET: HTTP_GET = ($) => {
  const pet = $.context.get($.path.petId);
  return pet ? $.response[200].json(pet) : $.response[404].text(`No pet ${$.path.petId}`);
};
```

### Hot reload — no restart, no lost state

Save a route file. The handler updates instantly. Your in-memory context survives every reload.

Save the OpenAPI spec. Your types update instantly and changes show up in your IDE. 

### Live REPL

A JavaScript prompt connected directly to your running server. Inspect state, fire requests, trigger edge cases — without touching a file.

```
⬣> context.list()
[ { id: 1, name: 'Fluffy', status: 'available' } ]

⬣> context.add({ name: 'Rex', photoUrls: [], status: 'pending' })
{ id: 2, name: 'Rex', status: 'pending', photoUrls: [] }

⬣> client.get("/pet/2")
{ status: 200, body: { id: 2, name: 'Rex', ... } }
```

### Hybrid proxy

Mock the paths that you want to control. Forward the rest to the real API. Toggle individual paths at runtime from the REPL.

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://api.example.com
```

```
⬣> .proxy on /payments    # /payments/* → real API
⬣> .proxy off             # all paths → mock
```


## Perfect for

- **Frontend teams** building against an unfinished backend
- **API-first teams** who design the contract before writing code
- **QA engineers** who need to simulate edge cases, failure modes, and stateful scenarios on demand
- **Developers** writing integration or end-to-end tests against a real HTTP server
- **AI agents** that call third-party APIs — avoid rate limits and outages by running locally against a full-fidelity mock
- **Developers exploring new APIs** — experiment freely before you have a signed contract, test credentials, or production access


## How it compares

| | Counterfact | json-server | WireMock | Prism | Microcks |
|---|---|---|---|---|---|
| **OpenAPI-native** | ✅ | ❌ | Partial | ✅ | ✅ |
| **Type-safe handlers** | ✅ TypeScript | ❌ | ❌ | ❌ | ❌ |
| **Real logic in handlers** | ✅ | Limited | Via templating | ❌ | Via scripts |
| **Hot reload** | ✅ state-preserving | ❌ | ❌ | ❌ | ❌ |
| **In-memory state** | ✅ shared Context | ✅ flat JSON | ❌ | ❌ | ❌ |
| **Interactive REPL** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Hybrid proxy** | ✅ per-path | ❌ | ✅ | ✅ | ✅ |
| **Request validation** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Automated test use** | ✅ real HTTP server | ✅ | ✅ | ✅ | ✅ |
| **Zero config** | ✅ one command | ✅ | ❌ | ❌ | ❌ |

See [How it compares](./docs/comparison.md) for a full breakdown.


## Go deeper

| | |
|---|---|
| [Getting started](./docs/getting-started.md) | Step-by-step walkthrough from zero to a stateful mock |
| [Reference](./docs/reference.md) | `$` parameter, response builder, CLI flags, architecture |
| [FAQ](./docs/faq.md) | Common questions about state, types, regeneration, and more |
| [How it compares](./docs/comparison.md) | Side-by-side with json-server, WireMock, Prism, Microcks, MSW |
| [Petstore example](https://github.com/counterfact/example-petstore) | A complete worked example: the Swagger Petstore, fully implemented |
| [Usage guide](./docs/usage.md) | Full documentation |
| [Changelog](./CHANGELOG.md) | What's changed |
| [Contributing](./CONTRIBUTING.md) | How to help |


<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>
