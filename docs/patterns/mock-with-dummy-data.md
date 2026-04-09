# Mock APIs with Dummy Data

You need your mock server to return realistic data so a UI renders plausibly, a demo looks credible, or a test can assert on specific field values.

## Problem

Out-of-the-box random responses conform to the schema but carry meaningless data — random strings, arbitrary numbers. Hardcoding responses in every handler is brittle and hard to maintain. You need a repeatable way to serve controlled, realistic data.

## Solution

Choose the approach that fits how much control you need:

- **Random schema-valid data** — zero effort, good enough to unblock a frontend.
- **Named OpenAPI examples** — define realistic values once in the spec; reference them by name in handlers.
- **Fixed handler data** — return exactly what your client needs from the handler code.
- **Stateful CRUD** — use a `_.context.ts` file so POST, GET, PUT, and DELETE work together across requests.

## Example

### Random data (zero effort)

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};
```

### Named OpenAPI example

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].example("fullPet");
  //                              ^ name is autocompleted from the spec
};
```

### Fixed data

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].json({
    id: $.path.petId,
    name: "Fluffy",
    status: "available",
    photoUrls: ["https://example.com/fluffy.jpg"],
  });
};
```

### Stateful CRUD

Share in-memory state across routes using a `_.context.ts` file:

```ts
// api/routes/_.context.ts
import type { Pet } from "../types/components/pet.types.js";

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
  return pet ? $.response[200].json(pet) : $.response[404].text("Not found");
};
export const DELETE: HTTP_DELETE = ($) => {
  $.context.remove($.path.petId);
  return $.response[200];
};
```

## Consequences

- The stateful CRUD approach behaves like a real API for the duration of a session; state resets to zero on server restart.
- Named examples keep realistic values in the spec where they belong, reducing duplication.
- Fixed handler data is easy to write but must be updated manually when the spec changes.
- TypeScript enforces that the data returned from any handler matches the spec-derived response schema.

## Related Patterns

- [Explore a New API](./explore-new-api.md) — start with `.random()` before adding realistic data
- [Reference Implementation](./reference-implementation.md) — extend stateful CRUD into a full, spec-conformant implementation
- [Simulate Failures and Edge Cases](./simulate-failures.md) — add error paths alongside the happy-path handlers
