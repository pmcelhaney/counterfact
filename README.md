<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>
<br><br><br>
</div>

**Spin up a mock server instantly. No config, no fuss. Try it now:**

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json mock-api
```

This command reads an OpenAPI spec (the [Swagger Petstore](https://petstore.swagger.io)), generates TypeScript code for a mock server in `mock-api`, and starts the server.

Want control? Edit the generated route files (e.g. `./mock-api/routes/store/order/{orderID}.ts`) and define responses directly. A type-safe API from your spec speeds up prototyping.

Go further with stateful mocks: POST data, then GET it back. Tweak backend data live with a REPL. Update code without restarting the server or losing state.

We believe strongly in API-first development and the Dependency Inversion Principle. When front-end and back-end implement the same API spec, they can be built and tested independently. Most of the time it's preferable to test the front end directly against the real API and the full stack behind it. But there's always some part of the back-end that isn't finished yet, or a scenario that's cumbersome to reproduce. For this reason, Counterfact supports proxying to the real API for some paths and using mocks for others.

Counterfact was by built an engineer who spent decades writing front-end code and got tired of being slowed down by unfinished or unwieldy back-end APIs. This is the fastest way to get unblocked, prototype ideas, and remember what it feels like to enjoy creating stuff.

<div align="center" markdown="1">

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>

<br>
<div align="center"  markdown="1">

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>
