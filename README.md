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

Counterfact is a free and open source **mock server** designed to hit the sweet spot every front-end engineer craves: **_real enough to be useful but fake enough to be usable_**. It stands in for the back-end code that doesn't exist yet or is too complex / rigid to suit your front-end development and testing workflow.

Counterfact enables **API-first** development where the front-end and back-end are built in parallel. It can even be used to _prototype_ the back-end, rapidly iterate on the API, and defer big decisions / investments until the [last responsible moment](https://blog.codinghorror.com/the-last-responsible-moment/).

Like your favorite pair of sweatpants, Counterfact is lightweight, flexible, and comfortable; it stretches and shrinks to fit your project's unique contours. Best of all, it makes your <del>ass</del> <ins>boss</ins> look good. Go ahead, [try it on](./docs/quick-start.md).

## Why Use Counterfact?

- **Seamless API Mocking:** Say goodbye to back-end hassles. Counterfact offers a streamlined API-first approach to building and testing your front-end.
- **Effortless Productivity:** Reuse your existing OpenAPI/Swagger documentation to auto-generate TypeScript code.
- **Instant Gratification:** If you have Node installed and an OpenAPI document handy, you're [one command away](./docs/quick-start.md) from a dependency-free workflow.
- **Flexibility at Your Fingertips:** Effortlessly toggle between mock and real services, change behavior without losing state, simulate complex use cases and error conditions, etc.
- **Dev Tools on the server:** That's what it feels like. Change code in a running server and see the effect immediately. It even has a REPL, like the JS console in your browser.
- **High code, low effort:** Wouldn't you love the simplicity of a "low code" / "no code" tool without giving up the flexibility and power you get from knowing how to write TypeScript? Inconceivable, you say? [Don't knock it 'til you try it](./docs/quick-start.md).
- **Plays well with others:** Counterfact works with anything that depends on a REST API, including web apps, mobile apps, desktop apps, and microservices. It requires zero changes to your front-end framework or code.

## 10 Second Quick Start

To see Counterfact in action run the following command in your terminal:

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.yaml api --open
```

This command installs Counterfact from npm, sets up a mock server implementing the [Swagger Petstore](https://petstore.swagger.io/), and opens a dashboard in a web browser. As long as you have Node 16 or later installed, it should "just work".

## Documentation

For more detailed information, such as how to go beyond simple mocks that return random values, visit our [tutorial](./docs/quick-start.md) and [usage guide](./docs/usage.md).

## Similar Tools and Alternatives

While Counterfact offers a unique approach to API mocking that we believe provides the best overall DX, we understand the importance of having the right tool for your specific needs. Here are some similar tools and alternatives you might find useful:

[**Mirage JS**](https://miragejs.com/) has more or less the same goals as Counterfact and very different approaches to achieving them. Some notable differences are that it runs in a browser instead of Node, does not integrate with OpenAPI, and does support GraphQL.

If your goal is to get a server up and running quickly and your API doesn't do much beyond storing and retrieving data, [**JSON Server**](https://github.com/typicode/json-server) may be a great fit for you.

If your mocking needs are relatively simple and you're shopping for someone who has no reason to have Node installed their computer, [**Beeceptor**](https://beeceptor.com/), [**Mockoon**](https://mockoon.com/), and [**Mocky.io**](https://www.mocky.io/) are worth checking out. Mocky is free; the others have free and paid tiers.

## Feedback and Contributions

We value _all_ of your feedback and contributions, including 💌 love letters , 💡 feature requests, 🐞 bug reports, and ✍️ grammatical nit-picks in the docs. Please [create an issue](https://github.com/pmcelhaney/counterfact/issues/new), open a pull request, or reach out to <pmcelhaney@gmail.com>.

**Welcom to the bottom of the README club! Since you've come this far, go ahead and smash that like and subsc… er, uh, give this project a ⭐️ on Github!** 🙏🏼
