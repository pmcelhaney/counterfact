<div align="center" markdown="1">

# Counterfact

## _High code, low effort mock REST APIs_

[Quick Start](./docs/quick-start.md) | [Documentation](./docs/usage.md) | [Contributing](CONTRIBUTING.md)

</div>

<br>

<div align="center"  markdown="1">

[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact) [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main) ![MIT License](https://img.shields.io/badge/license-MIT-blue)

</div>

## Who is this for?

Counterfact is for **front-end and full-stack engineers** who want to build and test frontend code when the backend -- due to inherent complexity or other forces -- is slow to configure, build, start, run, or change. Or when the APIs for a particular feature don't yet exist.

It is _not_ a front-end framework. It doesn't replace or alter anything in your existing stack. It works with your existing stack as long as your stack uses REST APIs.

### Backstory

Having worked on several different teams at companies large and small, I found a consistent frustrating pattern: **When I was working on frontend code, I spent more time fiddling with the backend so that I could test the frontend than I did building features and fixing bugs.** In order to move faster, I started creating lightweight mock services that I could use in development. That of course meant maintaining two back ends -- the real one and the mocks -- trading one problem for another.

However, over the course of several years, I found ways to minimize the effort to create and maintain mocks. For example, if the APIs are documented with OpenAPI / Swagger (they should be!) we can use that documentation to automatically generate code. Since a mock server doesn't need to scale or be secure, we can optimize everything around developer experience. These optimizations have culminated in **Counterfact, the fastest and easiest way to build and maintain mock REST APIs.**

<details>
<summary>What's wrong with the status quo?</summary>

- A typical web application these days spans multiple microservices, databases, etc. Standing up the whole stack locally takes a lot of effort (and defeats one of the main benefits of microservices).
- It's not uncommon for teams to run the front end locally and point to an API on a dev or QA server. Multiple developers working against the same backend with shared state is a recipe for disaster.
- Getting the back end in a state necessary to test functionality in the front end is tedious and time consuming, if not impossible.
- A mock server can help. But a mock server that returns random or predetermined responses can only get us so far. For testing multiple step workflows, sometimes we need a real server, or something that mimics the behavior of a real server. Ideally, we want something that mimics a real server except when we want it to behave in a controlled, predictable manner.
- From a customer's point of view, the frontend _is_ the app. If we can build the frontend without first having a backend in place, we can reduce cycle time and overproduction significantly.
- On some level, you got into software development because its _fun_. Don't you wish you could spend more time on the fun aspects of writing code and less time on tedious set up and testing?

</ul>

</details>

## Usage

Run the following command in your terminal and answer "yes" if when it asks to install the package.

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api --open
```

Assuming your have NodeJS 16+ installed, it will read the Open API spec for the Swagger Petstore, generate a TypeScript and Node based mock server based on that spec in the output directory ("api"), start the server, and open a browser with some tools to try out the API.

Try it out on your own [OpenAPI / Swagger spec](https://www.moesif.com/blog/technical/api-design/Benefits-of-using-the-OpenAPI-Swagger-specification-for-your-API/). Versions 2 and 3 are supported. You can point to a URL or a local file.

## What I can do with Counterfact?

### In a few seconds:

- Turn an OpenAPI / Swagger spec into a mock server
  <details>
  <summary>Show me</summary>

  Using the Swagger Petstore as an example:

  ```sh
    npx counterfact ...
  ```

  </details>

- Generate TypeScript types
- Toggle between mocks and real services

### In a few minutes:

- Enhance auto-generated mocking code with business logic and state. A few small changes can go transform your totally fake endpoint to a fully functional replica of the real one, or anything in between.
- Interact with the mock server's context via a REPL.
- Simulate real-world conditions, such as a user with an extra long email address, low inventory, HTTP error codes, or latency.
- Prototype and rapidly iterate on a REST APIs.

More info under [Documentation](./docs/usage.md).

---

Please send feedback / questions to pmcelhaney@gmail.com or [create a new issue](https://github.com/pmcelhaney/counterfact/issues/new). If you like what you see, please give this project a star!
