<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>
<br><br><br>
</div>

**Spin up a mock server instantly. No config, no fuss. Try it now:**

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json mock-api
```

This command reads an OpenAPI spec (the [Swagger Petstore](https://petstore.swagger.io)), generates TypeScript code for a mock server in `mock-api`, and starts the server.

<details>
<summary>Example of generated code</summary>

```ts
// ./mock-api/routes/store/order/{orderID}.ts
import type { HTTP_GET } from "../../../types/paths/store/order/{orderId}.types.js";
import type { HTTP_DELETE } from "../../../types/paths/store/order/{orderId}.types.js";

export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};

export const DELETE: HTTP_DELETE = ($) => {
  return $.response[200];
};
```

</details>

Want control? Edit the generated route files (e.g. `./mock-api/routes/store/order/{orderID}.ts`) and define responses directly. A type-safe API from your spec speeds up prototyping.

<details>
<summary>Edit the code to define custom behavior and responses</summary>

```ts
// ./mock-api/routes/store/order/{orderID}.ts
import { Order } from "../../../types/components/schemas/Order.js";
import type { HTTP_GET } from "../../../types/paths/store/order/{orderId}.types.js";
import type { HTTP_DELETE } from "../../../types/paths/store/order/{orderId}.types.js";

export const GET: HTTP_GET = ($) => {
  const orders: Record<number, Order> = {
    1: {
      petId: 100,
      status: "placed",
    },
    2: {
      petId: 999,
      status: "approved",
    },
    3: {
      petId: 1234,
      status: "delivered",
    },
  };

  const order = orders[$.request.orderID];

  if (order === undefined) {
    return $.response[404];
  }

  return $.response[200].json(order);
};

export const DELETE: HTTP_DELETE = ($) => {
  return $.response[200];
};
```

</details>

You can also **proxy some paths to the real API** while mocking others — perfect when part of the backend isn’t finished or you need to simulate tricky scenarios. See [Proxying](./docs/usage.md#proxying-to-a-real-api) for details.

Use `npx counterfact --help` to view CLI flags for customizing behavior (e.g. `--port`, `--proxy`, `--watch`).

Go further with stateful mocks: POST data, then GET it back. Tweak backend data live with a REPL. Update code without restarting the server or losing state.

We believe strongly in API-first development and the Dependency Inversion Principle. When frontend and backend implement the same API spec, they can be built and tested independently. Most of the time, it’s best to test the front end against the real API and full stack. But there's always some part of the backend that isn't finished yet, or a scenario that's cumbersome to reproduce. For this reason, Counterfact supports proxying to the real API for some paths and using mocks for others.

Counterfact was by built an engineer who spent decades writing frontend code and got tired of being slowed down by unfinished or unwieldy backend APIs. This is the fastest way to get unblocked, prototype ideas, and remember what it feels like to enjoy creating stuff.

> Requires Node ≥ 17.0.0

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>

<br>
<div align="center"  markdown="1">

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>
