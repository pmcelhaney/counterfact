<div align="center"  markdown="1">

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](./typescript-badge.png)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

<br>

<div align="center" markdown="1">

<img src="./counterfact.svg" alt="Counterfact" border=0>

_A Mock Server for High-performing Front-end Teams_

[Documentation](./docs/usage.md) | [Changelog](./CHANGELOG.md) | [Contributing](./CONTRIBUTING.md)

</div>

**Spin up a mock server instantly. No config, no fuss.**

Try it now:
git a

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json mock-api
```

This command reads the [Swagger Petstore](https://www.google.com/search?client=safari&rls=en&q=swagger+petstore&ie=UTF-8&oe=UTF-8) spec (you can replace the URL with the path to your own spec) and puts TypeScript code for mock server in a directory called `mock-api`, and starts the server. Want control? Edit the generated route file (e.g. ./mock-api/routes/store/order/{orderID}.ts) and define responses directly. A type-safe API from your spec speeds up prototyping.

Go further with stateful mocks: POST data, then GET it back. Tweak backend data live with the REPL. Update code without restarting the server or losing state.
