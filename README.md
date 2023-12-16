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

Counterfact is a cutting-edge mock server designed specifically for front-end engineers. It simplifies API mocking, enhances productivity with auto-generated TypeScript code from OpenAPI/Swagger documentation, and offers unparalleled flexibility for simulating complex scenarios.

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

While Counterfact offers a unique approach to API mocking tailored for front-end development, we understand the importance of having the right tool for your specific needs. Here are some similar tools and alternatives you might find useful:

[**Mirage JS**](https://miragejs.com/): has goals that are very similar to Counterfact's and very different approaches to meeting them. For example, it runs in a browser instead of Node, does not integrate with OpenAPI, and does support GraphQL.

[**Mockoon**](https://mockoon.com/): A user-friendly desktop application that allows you to quickly create mock APIs locally.

[**WireMock**](http://wiremock.org/): An advanced tool for mocking HTTP-based APIs, suitable for more complex testing scenarios.

[**Postman Mock Server**](https://www.postman.com/): Part of the popular Postman suite, this tool is great for those already using Postman for API testing.

[**JSON Server**](https://github.com/typicode/json-server): Provides a quick and simple way to set up a full fake REST API using a straightforward JSON file.

[**Mocky.io**](https://www.mocky.io/): An online service for creating custom HTTP responses, perfect for quick and hassle-free API response simulations.

[**Beeceptor**](https://beeceptor.com/): An easy-to-use online platform for mocking and intercepting APIs without any code changes.

[**Pact**](https://docs.pact.io/): Focuses on contract testing, ensuring that integrations between services are correctly maintained.

[**Nock**](https://github.com/nock/nock): Specifically designed for Node.js, this tool is great for mocking HTTP requests in Node.js applications.

Each of these tools has its unique features and use cases. We encourage you to explore them and choose the one that best fits your project requirements.

## Feedback and Contributions

We value your feedback and contributions, including feature requests and bug reports. Please [create an issue](https://github.com/pmcelhaney/counterfact/issues/new), open a pull request, or reach out to <pmcelhaney@counterfact.com>

**If you like what you see, give Counterfact a ⭐️ on GitHub!**
