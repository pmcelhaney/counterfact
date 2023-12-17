<div align="center"  markdown="1">

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](https://badges.frapsoft.com/typescript/love/typescript.png?v=101)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

<br>

<div align="center" markdown="1">

# Counterfact

_The Ultimate Mock Server for Front-End Engineers_

[Quick Start](./docs/quick-start.md) | [Documentation](./docs/usage.md) | [Contributing](CONTRIBUTING.md)

</div>

<br>

Counterfact is a cutting-edge mock server that stands in for a back end that either doesn't exist yet or can't be easily stood up for local development. It's also invaluable for testing front-end workflows that depend on the server being in particular, known states. It can even be used to prototype an API before investing in the real thing.

What sets Counterfact apart from other mock servers is it starts simple and grows with your needs. It reads your OpenAPI/Swagger documentation and generates TypeScript code that returns random values for each endpoint. From there you can edit the code to add behavior and state until you reach the sweet spot between _real enough to be useful_ and _fake enough to be usable_.

While one doesn't need to know TypeScript to use Counterfact, it assumes most end front end engineers have at least a working knowledge and puts those skills to use. Counterfact was born out the following question: **what would it look like to take advantage of OpenAPI, type safety and autocomplete to super-charge our productivity?**

## Why Use Counterfact?

- **Seamless API Mocking:** Say goodbye to back-end hassles. Counterfact offers a streamlined API-first approach to building and testing your front-end.
- **Effortless Productivity:** Utilize your existing OpenAPI/Swagger documentation to auto-generate TypeScript code.
- **Instant Gratification:** If you have Node installed and an OpenAPI spec handy, you're one command away from a dependency-free workflow.
- **Flexibility at Your Fingertips:** Easily toggle between mock and real services, change behavior without losing state, simulate complex use cases and error conditions, make runtime tweaks with a REPL (like having dev tools on the server side).
- **Plays Well with Others:** Do you use NextJS? Are you an iOS Swiftie? Do you have the Angular logo tattooed on your forearm? Counterfact requires no alterations to your front-end code.

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
