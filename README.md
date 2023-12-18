<div align="center"  markdown="1">

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](https://badges.frapsoft.com/typescript/love/typescript.png?v=101)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

<br>

<div align="center" markdown="1">

# Counterfact

_A Mock Server for High-performing Front-end Teams_

[Quick Start](./docs/quick-start.md) | [Documentation](./docs/usage.md) | [Contributing](CONTRIBUTING.md)

</div>

<br>

Counterfact is a **mock server** designed to hit the sweet spot every front-end engineers craves: **_real enough to be useful but fake enough to be usable_**. It stands in for a server that doesn't yet exist, or the one that's too complex / rigid to suit your development and testing needs.

Counterfact enables **API-first** development where the front-end and back-end are built in parallel. It can even be used to _prototype_ the back-end to get rapid feedback, deferring big decisions and investments until the last responsible moment.

Like your favorite pair of sweatpants, Counterfact is lightweight, flexible, and comfortable; it stretches and shrinks to fit your project's unique contours. Best of all, it makes your <del>ass</del> <ins>boss</ins> look good. Go ahead, [try it on](./docs/quick-start.md).

## Why Use Counterfact?

- **Seamless API Mocking:** Say goodbye to back-end hassles. Counterfact offers a streamlined API-first approach to building and testing your front-end.
- **Effortless Productivity:** Reuse your existing OpenAPI/Swagger documentation to auto-generate TypeScript code.
- **Instant Gratification:** If you have Node installed and an OpenAPI spec handy, you're one command away from a dependency-free workflow.
- **Flexibility at Your Fingertips:** Easily toggle between mock and real services, change behavior without losing state, simulate complex use cases and error conditions, make runtime tweaks with a REPL.
- **Devtools on the server:** That's what it feels like. Make a change, see the effect instantly. It even have a REPL (like the console in your browser).
- **Plays well with others:** Counterfact works with anything that depends on a REST API, including web apps, mobile apps, and even other APIs. It requires zero changes to your front-end code.

## 10 Second Quick Start

To see Counterfact in action run the following command in your terminal:

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.yaml api --open
```

This command installs Counterfact, sets up a mock server implementing the [Swagger Petstore](https://petstore.swagger.io/), and opens a dashboard in a web browser.

## Documentation

For more detailed information and usage guidelines, visit our [tutorial](./docs/quick-start.md) and [usage guide](./docs/usage.md).

## Similar Tools and Alternatives

While Counterfact offers a unique approach to API mocking that we believe provides the best overall DX, we understand the importance of having the right tool for your specific needs. Here are some similar tools and alternatives you might find useful:

[**Mirage JS**](https://miragejs.com/) has more or less the same goals as Counterfact and very different approaches to achieving those goals. Some notable differences are it runs in a browser instead of Node, does not integrate with OpenAPI, and does support GraphQL.

If your goal is to get a server up and running quickly and your API doesn't do much beyond storing and retrieving data, [**JSON Server**](https://github.com/typicode/json-server) may be a great choice for you.

If your mocking needs are relatively simple you may want to check out [**Beeceptor**](https://beeceptor.com/), [**Mockoon**](https://mockoon.com/), or [**Mocky.io**](https://www.mocky.io/), each of which provide low code / no code solutions. Mocky is free; the others have free and paid tiers.

## Feedback and Contributions

We value your feedback and contributions, including feature requests and bug reports. Please [create an issue](https://github.com/pmcelhaney/counterfact/issues/new), open a pull request, or reach out to <pmcelhaney@gmail.com>

**If you like what you see, give Counterfact a ⭐️ on GitHub!**
