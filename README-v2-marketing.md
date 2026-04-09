<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

<br>

**Your backend isn't ready. Your frontend can't wait. Counterfact closes the gap.**

<br>

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

---

## One command. Live mock API. No waiting.

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

Point it at any OpenAPI spec. Counterfact generates TypeScript route files, starts a server, and opens Swagger UI — **in seconds**.

---

## Why Counterfact?

Teams waste weeks blocked on API dependencies. Counterfact eliminates that wait without adding complexity.

| The old way | With Counterfact |
|---|---|
| Wait for the backend to be ready | Start building against a live mock today |
| Hardcode fake data that breaks silently | Get type-safe responses generated from your spec |
| Restart the server every time you change something | Hot-reload keeps state while you iterate |
| Write a script to seed test data | Use the REPL to manipulate state interactively |
| Mock a few endpoints, ignore the rest | Every endpoint works out of the box |
| Return dumb static payloads | Write real logic — validate input, persist data, enforce business rules |

---

## It's a real server. You control it.

Counterfact isn't a record/replay proxy or a static fixture system. It's a **programmable server** you own. Every endpoint is a TypeScript file with real logic — you can validate input, maintain state, branch on query parameters, and return different status codes based on what was sent. It behaves like an actual backend because, for your purposes, it is one.

- **TypeScript handlers** — every endpoint is a `.ts` file you can open and edit
- **Real logic, not just fixtures** — POST data and GET it back; enforce validation; simulate errors
- **Type safety from your spec** — autocomplete guides you to valid responses
- **Hot reload** — save a file, changes apply instantly, no data lost
- **Live REPL** — tweak state, trigger edge cases, test failure paths — without touching files

---

## Get started in 60 seconds

**Step 1.** Run one command:

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

**Step 2.** Open `http://localhost:3100/counterfact/` in your browser.

**Step 3.** Edit any file in `api/routes/` and watch the server update live.

That's it. Replace the Petstore URL with your own spec and you're building against your real API contract.

> Requires Node ≥ 22.0.0

---

## What you get

### ⚡ Instant responses — no code required

Every generated route returns random, schema-valid data out of the box.

```ts
export const GET: HTTP_GET = ($) => $.response[200].random();
```

### 🔒 Type safety and documentation baked in

Your spec defines the contract. TypeScript enforces it. Autocomplete tells you exactly what response shapes are valid, and JSDoc comments — pulled straight from your OpenAPI descriptions — appear inline as you type.

```ts
export const GET: HTTP_GET = ($) =>
  $.response[200].json({ id: $.path.petId, name: "Fluffy" });
  //                       ^ hover over `id` or `name` to see the JSDoc from your spec
```

### 🧠 Shared state across routes

Use a `_.context.ts` file to share in-memory state across related routes. Because state lives in the same process as the server it's lightning-fast, scalability doesn't matter (you're the only one using it), and restarting the server resets everything to a known clean state — no leftover data between test runs.

```ts
// routes/_.context.ts
export class Context {
  pets: Pet[] = [];
  add(pet: Pet) { this.pets.push(pet); return pet; }
  find(id: number) { return this.pets[id]; }
}

// routes/pet.ts
export const POST: HTTP_POST = ($) =>
  $.response[200].json($.context.add($.body));

// routes/pet/{petId}.ts
export const GET: HTTP_GET = ($) =>
  $.response[200].json($.context.find($.path.petId));
```

### 🖥 Live REPL

Inspect state, fire requests, and simulate edge cases — all from your terminal while the server runs.

```
⬣> context.pets.length
2
⬣> context.add({ name: "Rex", photoUrls: [] })
⬣> client.get("/pet/2")
```

### 🔀 Hybrid proxy

Mock the parts that don't exist yet. Forward the rest to the real API.

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://api.example.com
```

---

## Perfect for

- **Frontend teams** building against an unfinished backend
- **API-first teams** who design the contract before writing code
- **QA engineers** who need to simulate edge cases and failure modes
- **Developers** who want to prototype fast without standing up infrastructure
- **AI agents** that call third-party APIs — avoid rate limits and outages by running locally against a full-fidelity mock
- **Developers exploring new APIs** — experiment freely before you have a signed contract or production credentials

---

## Learn more

- [Documentation](./docs/usage.md)
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md)

---

<div align="center" markdown="1">

**[Get started →](./docs/quick-start.md)**

</div>
