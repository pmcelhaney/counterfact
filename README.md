<div align="center"  markdown="1">

![MIT License](https://img.shields.io/badge/license-MIT-blue) [![TypeScript](https://badges.frapsoft.com/typescript/love/typescript.png?v=101)](https://github.com/ellerbrock/typescript-badges/) [![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact)

</div>

<br>

<div align="center" markdown="1">

# Counterfact

_The Ultimate Mock Server Every Front-End Engineer Dreams Of_

[Quick Start](./docs/quick-start.md) | [Documentation](./docs/usage.md) | [Contributing](CONTRIBUTING.md)

</div>

<br>

## Why Use Counterfact?

- **Seamless API Mocking:** Say goodbye to back-end hassles. Counterfact offers a streamlined API-first approach to building and testing your front-end.
- **Effortless Productivity:** Utilize your existing OpenAPI/Swagger documentation to auto-generate TypeScript code.
- **Instant Gratification:** If you have Node installed and an OpenAPI spec handy, you're one command away from a dependency-free workflow.
- **Flexibility at Your Fingertips:** Easily toggle between mock and real services, change behavior without losing state, simulate complex use cases and error conditions, and use developer-facing APIs inside a REPL.
- **Plays Well with Others:** Do use NextJS? Do you love Astro? Are you a die-hard Angular fan? Counterfact requires no alterations to your front-end code.

## 10 Second Quick Start

Copy the following command to your terminal.

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.yaml api --open
```

The above command installs and runs Counterfact, generates TypeScript code for a mock server based on the example OpenAPI spec (the [Swagger Petstore](https://petstore.swagger.io/)), puts the code in the `api` directory and `--open`'s a web browser.

## What People Are Saying about Counteract

**Steve Jobs**: "Counterfact is more than just a mock server; it's a paradigm shift in how we develop, test, and deploy web applications."

**Amelia Earhart:** "The most effective way to do it, is to do it. Counterfact embodies this spirit, propelling front-end development forward with action and ease."

**Marie Curie**: "I was taught that the way of progress was neither swift nor easy. Yet, Counterfact seems to defy that norm in software engineering."

**Donald Trump**: "You're gonna be so productive you won't even know it. You're going to look at me and you're gonna say I don't understand, where did this back-end come from? There was nothing, and then all of the sudden there's everything. And I'm gonna say I told you it's fast. I said it's fast and nobody believed me but it really is that fast. Very fast. Very productive. Faster than you've ever seen. Nobody's seen this fast before. I have, but nobody else has. Also Counterfact is fun. Very fun. Bigly fun. You're gonna have a lot of fun when you try out Counterfact yourself. Believe me."

---

More info under [Documentation](./docs/usage.md).

Please send feedback / questions to pmcelhaney@gmail.com or [create a new issue](https://github.com/pmcelhaney/counterfact/issues/new). If you like what you see, please give this project a star!
