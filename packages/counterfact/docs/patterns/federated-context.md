# Federated Context Files

Keep state for users, orders, payments, and other domains close to the routes that use it, without turning the whole mock into one unmanageable class.

## Why teams use this

Placing one `_.context.ts` at the root of the routes tree is convenient at first, but it accumulates all state for all domains in one object. Unrelated concerns become entangled: the `UserContext` knows about payment flags, the payment logic reaches into user fields, and the class grows until it is hard to understand or test in isolation.

## How it works

Place a `_.context.ts` file at each domain boundary. Each subtree owns its context and is responsible only for its own state and logic. When one domain needs data from another, inject `Context$` into its context constructor and use `$.loadContext(path)` there to reach across the boundary — without merging the two contexts into one.

This keeps each context class small, focused, and independently testable. The `_.context.ts` file nearest to a handler wins; a handler under `/payments` uses the payments context, not the root context.

## Example

Give each domain its own context:

```ts
// api/routes/users/_.context.ts
import type { User } from "../../types/components/user.types.js";

export class Context {
  private users = new Map<number, User>();
  private nextId = 1;

  add(data: Omit<User, "id">): User {
    const user = { ...data, id: this.nextId++ };
    this.users.set(user.id, user);
    return user;
  }

  getById(id: number): User | undefined {
    return this.users.get(id);
  }
  list(): User[] {
    return [...this.users.values()];
  }
}
```

```ts
// api/routes/payments/_.context.ts
import type { Payment } from "../../types/components/payment.types.js";
import type { Context$ } from "../../types/_.context.js";

export class Context {
  private payments = new Map<string, Payment>();
  private loadContext: Context$["loadContext"];

  constructor($: Context$) {
    this.loadContext = $.loadContext;
  }

  getWithUser(id: string) {
    const payment = this.getById(id);
    if (!payment) return undefined;
    const user = this.loadContext("/users").getById(payment.userId);
    return { ...payment, user };
  }

  record(payment: Payment): void {
    this.payments.set(payment.id, payment);
  }
  getById(id: string): Payment | undefined {
    return this.payments.get(id);
  }
  list(): Payment[] {
    return [...this.payments.values()];
  }
}
```

The payments context uses the injected helper when a request needs user data. Looking it up inside `getWithUser` avoids depending on context initialization order. The route delegates to that method:

```ts
// api/routes/payments/{paymentId}.ts
import type { HTTP_GET } from "../../types/paths/payments/{paymentId}.types.js";

export const GET: HTTP_GET = ($) => {
  const payment = $.context.getWithUser($.path.paymentId);
  if (!payment) return $.response[404].text("Payment not found");
  return $.response[200].json(payment);
};
```

This example assumes `Payment` has string `id` and numeric `userId`, and the GET operation declares the enriched JSON response and a text `404` response. Regenerate types after adding the context files so `Context$` has a typed `loadContext("/users")` overload.

The helper returns the live context nearest to the requested path. It is available to context constructors and scenarios; the REPL exposes it as `loadContext(path)`. Handler arguments do not expose `loadContext`, so cross-domain logic belongs in an authored context method. The two contexts remain independent classes.

## What you get

- Each context class has a single responsibility and a clear boundary; it is easier to understand and unit-test in isolation.
- `loadContext()` makes cross-domain dependencies explicit inside the context method, keeping the route adapter small.
- Generated overloads infer the context type for known literal paths; arbitrary string paths use the `Record<string, unknown>` fallback.
- Contexts are still shared within a subtree: all routes under `/payments` share the same payments context instance.

## Keep exploring

- [Share State Across API Groups](./shared-store.md) — use an application-level store when collaborating routes belong to different API groups
- [Test the Context, Not the Handlers](./test-context-not-handlers.md) — unit-test each context class independently
- [Mock APIs with Dummy Data](./mock-with-dummy-data.md) — the pattern that introduces the single-context approach this one extends
- [Live Server Inspection with the REPL](./repl-inspection.md) — inspect each domain's context live from the REPL
